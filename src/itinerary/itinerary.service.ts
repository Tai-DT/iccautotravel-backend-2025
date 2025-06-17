import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItineraryDto } from './dto/create-itinerary.dto';
import { UpdateItineraryDto } from './dto/update-itinerary.dto';
import { ConfigService } from '@nestjs/config';
import { GoogleAIService } from '../ai/google-ai.service';
import { GoongService } from '../goong/goong.service';
import { v4 as uuidv4 } from 'uuid';
import { ItineraryEntity } from './entities/itinerary.entity';

@Injectable()
export class ItineraryService {
  private readonly logger = new Logger(ItineraryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly googleAIService: GoogleAIService,
    private readonly goongService: GoongService,
  ) {}

  async generateItinerary(
    createItineraryDto: CreateItineraryDto,
  ): Promise<any> {
    this.logger.log(
      `Generating itinerary for: ${JSON.stringify(createItineraryDto)}`,
    );

    try {
      // 1. Generate AI suggestions
      const aiSuggestions =
        await this.googleAIService.generateTravelSuggestions({
          origin: createItineraryDto.origin,
          destination: createItineraryDto.destination,
          startDate: createItineraryDto.startDate,
          endDate: createItineraryDto.endDate,
          preferences: createItineraryDto.preferences,
          budget: createItineraryDto.budget,
          travelType: createItineraryDto.travelType,
        });

      // 2. For each suggested location, get details from Goong.io
      const enrichedDays = await Promise.all(
        aiSuggestions.days.map(async (day: any) => {
          const enrichedActivities = await Promise.all(
            day.activities.map(async (activity: any) => {
              try {
                // Search for the location using Goong.io
                const searchResult = await this.goongService.searchPlaces(
                  activity.location,
                  `${createItineraryDto.destination}`,
                );

                if (searchResult.results && searchResult.results.length > 0) {
                  const place = searchResult.results[0];

                  // Get place details
                  const placeDetails = await this.goongService.getPlaceDetail(
                    place.place_id,
                  );

                  return {
                    ...activity,
                    placeDetails: placeDetails.result,
                    coordinates: place.geometry.location,
                  };
                }

                return activity;
              } catch (error: unknown) {
                const errorMessage =
                  error instanceof Error ? error.message : String(error);
                this.logger.error(`Error enriching activity: ${errorMessage}`);
                return activity;
              }
            }),
          );

          return {
            ...day,
            activities: enrichedActivities,
          };
        }),
      );

      // 3. Calculate routes between locations for each day
      const daysWithRoutes = await Promise.all(
        enrichedDays.map(async (day) => {
          const activitiesWithCoordinates = day.activities.filter(
            (a: any) => a.coordinates,
          );

          if (activitiesWithCoordinates.length < 2) {
            return day;
          }

          try {
            const origins = activitiesWithCoordinates.slice(0, -1);
            const destinations = activitiesWithCoordinates.slice(1);

            const routes = await Promise.all(
              origins.map((origin: any, index: number) => {
                const destination = destinations[index];
                return this.goongService.getDirections(
                  `${origin.coordinates.lat},${origin.coordinates.lng}`,
                  `${destination.coordinates.lat},${destination.coordinates.lng}`,
                );
              }),
            );

            return {
              ...day,
              routes,
            };
          } catch (error: unknown) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            this.logger.error(`Error calculating routes: ${errorMessage}`);
            return day;
          }
        }),
      );

      return {
        ...aiSuggestions,
        days: daysWithRoutes,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error generating itinerary: ${errorMessage}`);
      throw error;
    }
  }

  async createWithAI(createItineraryDto: CreateItineraryDto, userId: string) {
    // Generate the itinerary
    const generatedItinerary = await this.generateItinerary(createItineraryDto);

    // Create the itinerary in the database
    const itinerary = await this.prisma.itinerary.create({
      data: {
        id: uuidv4(),
        userId,
        // Store additional information in the preferences JSON field which exists in the schema
        preferences: {
          origin: createItineraryDto.origin,
          destination: createItineraryDto.destination,
          userPreferences: createItineraryDto.preferences,
          title: `${createItineraryDto.origin} to ${createItineraryDto.destination}`,
        },
        origin: createItineraryDto.origin,
        destination: createItineraryDto.destination,
        startDate: createItineraryDto.startDate,
        endDate: createItineraryDto.endDate,
        status: 'DRAFT', // Compatible with enum ItineraryStatus
        updatedAt: new Date(),
      },
    });

    // Create legs for each day
    const legs = await Promise.all(
      generatedItinerary.days.map(async (day: any, index: number) => {
        // Calculate distance and duration if available
        const distanceKm =
          day.routes?.[0]?.routes?.[0]?.legs?.[0]?.distance?.value / 1000 ||
          null;
        const durationMin =
          day.routes?.[0]?.routes?.[0]?.legs?.[0]?.duration?.value / 60 || null;

        const leg = await this.prisma.leg.create({
          data: {
            id: uuidv4(),
            itineraryId: itinerary.id,
            description: `Day ${index + 1} - ${day.date} - ${distanceKm ? `Distance: ${distanceKm.toFixed(2)}km` : ''}`,
            dayNumber: index + 1,
            distanceKm: distanceKm,
            durationMin: durationMin,
            updatedAt: new Date(),
          },
        });

        // Create POIs for each activity
        await Promise.all(
          day.activities.map(async (activity: any, activityIndex: number) => {
            if (activity.coordinates) {
              await this.prisma.pOI.create({
                data: {
                  id: uuidv4(),
                  legId: leg.id,
                  name: activity.location,
                  description: activity.activity,
                  latitude: activity.coordinates
                    ? activity.coordinates.lat
                    : null,
                  longitude: activity.coordinates
                    ? activity.coordinates.lng
                    : null,
                  timeSpentMin: 60, // Default 1 hour in minutes
                  order: activityIndex,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              });
            }
          }),
        );

        return leg;
      }),
    );

    // Create suggestions based on recommendations
    if (generatedItinerary.recommendations) {
      const { attractions, restaurants, accommodations } =
        generatedItinerary.recommendations;

      // Create attraction suggestions
      if (attractions && attractions.length > 0) {
        await Promise.all(
          attractions.map(async (attraction: any) => {
            await this.prisma.suggestion.create({
              data: {
                id: uuidv4(),
                itineraryId: itinerary.id,
                serviceType: 'TOUR', // Use a valid ServiceType from the enum
                description: attraction,
                updatedAt: new Date(),
              },
            });
          }),
        );
      }

      // Create restaurant suggestions
      if (restaurants && restaurants.length > 0) {
        await Promise.all(
          restaurants.map(async (restaurant: any) => {
            await this.prisma.suggestion.create({
              data: {
                id: uuidv4(),
                itineraryId: itinerary.id,
                serviceType: 'HOTEL', // Use a valid ServiceType for restaurants
                description: restaurant,
                updatedAt: new Date(),
              },
            });
          }),
        );
      }

      // Create accommodation suggestions
      if (accommodations && accommodations.length > 0) {
        await Promise.all(
          accommodations.map(async (accommodation: any) => {
            await this.prisma.suggestion.create({
              data: {
                id: uuidv4(),
                itineraryId: itinerary.id,
                serviceType: 'HOTEL', // Use a valid ServiceType for accommodations
                description: accommodation,
                updatedAt: new Date(),
              },
            });
          }),
        );
      }
    }

    return {
      itinerary: this.toEntity(itinerary),
      generatedContent: generatedItinerary,
    };
  }

  async findAll(userId?: string) {
    const where = userId ? { userId } : {};

    const itineraries = await this.prisma.itinerary.findMany({
      where,
      include: {
        Leg: {
          include: {
            POI: {
              orderBy: {
                order: 'asc', // Using 'order' field instead of 'sortOrder' which doesn't exist
              },
            },
          },
          orderBy: {
            dayNumber: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Convert database models to entities
    return itineraries.map((itinerary) => this.toEntity(itinerary));
  }

  async findOne(id: string) {
    const itinerary = await this.prisma.itinerary.findUnique({
      where: { id },
      include: {
        Leg: {
          include: {
            POI: {
              orderBy: {
                order: 'asc', // Using 'order' field instead of 'sortOrder' which doesn't exist
              },
            },
          },
          orderBy: {
            dayNumber: 'asc',
          },
        },
      },
    });

    if (!itinerary) {
      throw new NotFoundException(`Itinerary with ID ${id} not found`);
    }

    // Convert database model to entity
    return this.toEntity(itinerary);
  }

  async update(id: string, updateItineraryDto: UpdateItineraryDto) {
    await this.findOne(id);

    const updatedItinerary = await this.prisma.itinerary.update({
      where: { id },
      data: updateItineraryDto,
    });

    // Convert database model to entity
    return this.toEntity(updatedItinerary);
  }

  async remove(id: string) {
    await this.findOne(id);

    const deletedItinerary = await this.prisma.itinerary.delete({
      where: { id },
    });

    // Convert database model to entity
    return this.toEntity(deletedItinerary);
  }

  // Helper method to convert Prisma models to ItineraryEntity
  private toEntity(data: any): ItineraryEntity {
    const entity = new ItineraryEntity();

    // Map all properties from the database object to the entity
    Object.assign(entity, {
      id: data.id,
      userId: data.userId,
      origin: data.origin || '',
      destination: data.destination || '',
      startDate: data.startDate,
      endDate: data.endDate,
      preferences: data.preferences,
      budget: data.budget,
      status: data.status,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });

    return entity;
  }
}
