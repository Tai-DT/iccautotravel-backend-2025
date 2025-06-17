import { ObjectType, Field } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';

@ObjectType()
export class ActivityEntity {
  @Field({ nullable: true })
  activity?: string;

  @Field({ nullable: true })
  location?: string;

  @Field({ nullable: true })
  type?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  coordinates?: Record<string, any>;

  @Field(() => GraphQLJSON, { nullable: true })
  placeDetails?: Record<string, any>;
}

@ObjectType()
export class DayEntity {
  @Field({ nullable: true })
  date?: string;

  @Field(() => [ActivityEntity], { nullable: true })
  activities?: ActivityEntity[];

  @Field(() => GraphQLJSON, { nullable: true })
  routes?: Record<string, any>[];
}

@ObjectType()
export class RecommendationsEntity {
  @Field(() => [String], { nullable: true })
  attractions?: string[];

  @Field(() => [String], { nullable: true })
  restaurants?: string[];

  @Field(() => [String], { nullable: true })
  accommodations?: string[];
}

@ObjectType()
export class GeneratedItineraryEntity {
  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  summary?: string;

  @Field(() => [DayEntity], { nullable: true })
  days?: DayEntity[];

  @Field(() => RecommendationsEntity, { nullable: true })
  recommendations?: RecommendationsEntity;
}
