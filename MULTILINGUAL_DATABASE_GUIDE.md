# 🌍 ICCautoTravel Multilingual Database Guide

## Overview
This guide explains how to set up and use the comprehensive multilingual database for ICCautoTravel, supporting Vietnamese (vi), English (en), and Korean (ko) languages.

## 🚀 Quick Setup

### 1. Run the Multilingual Seed Script
```bash
cd iccautotravel-backend
chmod +x run-multilingual-seed.sh
./run-multilingual-seed.sh
```

### 2. Manual Setup (Alternative)
```bash
# Copy environment configuration
cp .env.development .env

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Run multilingual seed
npx tsx prisma/simple-multilingual-seed.ts
```

## 📊 Database Content

### Users & Authentication
- **Admin User**: `admin@iccautotravel.com` / `password123`
- **Sample Customers**: 15 users with different language preferences
- **Roles**: Admin, Customer with proper permissions

### Multilingual Content

#### 🏙️ Locations (3 languages each)
- Hà Nội / Hanoi / 하노이
- Hồ Chí Minh / Ho Chi Minh City / 호치민시  
- Đà Nẵng / Da Nang / 다낭
- Vịnh Hạ Long / Ha Long Bay / 하롱베이
- Hội An / Hoi An / 호이안

#### 📝 Blog Categories & Posts
- **Vietnamese**: Du lịch, Ẩm thực, Văn hóa
- **English**: Travel, Cuisine, Culture  
- **Korean**: 여행, 요리, 문화

#### 🎨 Banners
- Homepage banners in all 3 languages
- Professional travel service messaging
- Call-to-action buttons localized

#### 🚗 Services
- **Tours**: Ha Long Bay tours in 3 languages
- **Vehicles**: 7-seater car rentals in 3 languages
- Complete service details with pricing

#### ❓ FAQs
- Booking process explanations
- Cancellation policies
- Localized for each language

#### 🏢 Company Information
- Company descriptions in 3 languages
- Contact information
- Service highlights

## 🔧 API Usage Examples

### Fetch Content by Language
```javascript
// Get Vietnamese banners
const viBanners = await prisma.banner.findMany({
  where: { lang: 'vi', isActive: true }
});

// Get English blog posts
const enBlogs = await prisma.blog.findMany({
  where: { lang: 'en', status: 'PUBLISHED' }
});

// Get Korean FAQs
const koFaqs = await prisma.fAQ.findMany({
  where: { lang: 'ko', isActive: true }
});
```

### User Language Preferences
```javascript
// Get user's preferred language
const user = await prisma.user.findUnique({
  where: { id: userId }
});
const userLang = user.language; // 'vi', 'en', or 'ko'

// Fetch content in user's language
const content = await prisma.banner.findMany({
  where: { lang: userLang }
});
```

## 🌐 Frontend Integration

### Language Switching
```typescript
// Language context
const languages = {
  vi: 'Tiếng Việt',
  en: 'English', 
  ko: '한국어'
};

// API calls with language parameter
const fetchContent = async (lang: string) => {
  const response = await fetch(`/api/content?lang=${lang}`);
  return response.json();
};
```

### Content Display
```jsx
// Dynamic content based on language
const ContentComponent = ({ language }) => {
  const [content, setContent] = useState(null);
  
  useEffect(() => {
    fetchContentByLanguage(language).then(setContent);
  }, [language]);
  
  return (
    <div>
      {content?.banners.map(banner => (
        <Banner key={banner.id} {...banner} />
      ))}
    </div>
  );
};
```

## 📱 Dashboard Integration

### Admin Dashboard Features
- Content management in multiple languages
- User language preference tracking
- Multilingual booking management
- Language-specific analytics

### Customer Dashboard
- Auto-detect user language preference
- Switch between languages
- Localized booking history
- Language-appropriate service recommendations

## 🔍 Database Schema Highlights

### Language Support Fields
- `lang` field in: Banner, Blog, BlogCategory, FAQ, CompanyInfo
- `language` field in User model for preferences
- Proper indexing for language-based queries

### Content Relationships
- Blog posts linked to language-specific categories
- Services with multilingual descriptions
- Bookings maintain user language context

## 🚀 Performance Optimization

### Indexing Strategy
```sql
-- Language-based indexes for fast queries
CREATE INDEX idx_banner_lang ON Banner(lang, isActive);
CREATE INDEX idx_blog_lang ON Blog(lang, status);
CREATE INDEX idx_faq_lang ON FAQ(lang, isActive);
```

### Caching Recommendations
- Cache content by language
- Use Redis for frequently accessed multilingual data
- Implement CDN for static multilingual assets

## 🔧 Maintenance

### Adding New Languages
1. Update language constants in frontend
2. Add new content with appropriate `lang` values
3. Update API endpoints to handle new language codes
4. Create translations for UI elements

### Content Updates
```javascript
// Update content in specific language
await prisma.banner.update({
  where: { id: bannerId },
  data: {
    title: newTitle,
    lang: 'vi' // Specify language
  }
});
```

## 🎯 Best Practices

### 1. Language Fallback
```javascript
// Implement fallback to default language
const getContent = async (lang, fallbackLang = 'vi') => {
  let content = await fetchByLanguage(lang);
  if (!content.length) {
    content = await fetchByLanguage(fallbackLang);
  }
  return content;
};
```

### 2. SEO Optimization
- Use `hreflang` tags for multilingual pages
- Create language-specific sitemaps
- Implement proper URL structure (`/vi/`, `/en/`, `/ko/`)

### 3. User Experience
- Remember user language preference
- Provide easy language switching
- Maintain language consistency across sessions

## 📈 Analytics & Monitoring

### Language Usage Tracking
```javascript
// Track content views by language
await prisma.auditLog.create({
  data: {
    operation: 'VIEW',
    entityType: 'CONTENT',
    metadata: { language: userLang, contentType: 'banner' }
  }
});
```

### Performance Monitoring
- Monitor query performance by language
- Track language preference distribution
- Analyze content engagement by language

## 🔒 Security Considerations

- Validate language parameters to prevent injection
- Sanitize multilingual content input
- Implement proper access controls for content management
- Use parameterized queries for language-based filtering

## 🎉 Success Metrics

Your multilingual database is ready when you can:
- ✅ Display content in Vietnamese, English, and Korean
- ✅ Switch languages seamlessly in the frontend
- ✅ Manage multilingual content through admin dashboard
- ✅ Handle user language preferences
- ✅ Provide localized booking experiences
- ✅ Generate language-specific reports

## 🆘 Troubleshooting

### Common Issues
1. **Missing translations**: Check if content exists for requested language
2. **Performance issues**: Verify language indexes are in place
3. **Character encoding**: Ensure UTF-8 support for Korean/Vietnamese characters
4. **API errors**: Validate language parameter format and supported values

### Debug Commands
```bash
# Check database content by language
npx prisma studio

# Verify seed data
npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.banner.findMany({ where: { lang: 'vi' } }).then(console.log);
"
```

---

🎊 **Congratulations!** Your ICCautoTravel database now supports full multilingual functionality with comprehensive data in Vietnamese, English, and Korean! 