# 🛡️ Enhanced Security System Documentation

## Overview

This document outlines the enhanced security system implemented for ICC Auto Travel dashboard with comprehensive permissions, audit logging, and advanced security features.

## 🔐 Features Implemented

### 1. **Fine-Grained Permissions System**
- **Resource-based access control** (RBAC + ABAC)
- **Action-specific permissions** (read, create, update, delete, analytics)
- **Context-aware permissions** with AND/OR logic
- **Role hierarchy** with permission inheritance

### 2. **Advanced Authentication & Authorization**
- **Enhanced JWT guards** with session tracking
- **Multi-factor permission checks**
- **Resource ownership validation**
- **Real-time permission evaluation**

### 3. **Comprehensive Audit Logging**
- **Every API access logged** with context
- **Security event tracking** with threat detection
- **User activity monitoring** with behavioral analysis
- **Compliance-ready audit trails**

### 4. **Advanced Security Features**
- **Rate limiting** with IP-based throttling
- **Suspicious activity detection** with ML patterns
- **Automatic IP blocking** for repeated violations
- **Security headers** with OWASP compliance

## 📊 Dashboard Security Levels

### **Level 1: Basic Access**
```typescript
// Endpoints accessible with basic permissions
GET /dashboard-v2/overview           // PERMISSIONS.DASHBOARD.READ_BASIC
GET /dashboard-v2/popular-services   // PERMISSIONS.SERVICES.VIEW_ANALYTICS
```

### **Level 2: Administrative Access**
```typescript
// Endpoints requiring admin permissions
GET /dashboard-v2/overview/full      // PERMISSIONS.DASHBOARD.READ_FULL
GET /dashboard-v2/financial/summary  // PERMISSIONS.FINANCIAL.READ_REVENUE
GET /dashboard-v2/users/analytics    // PERMISSIONS.USERS.VIEW_ANALYTICS
```

### **Level 3: Super Admin Access**
```typescript
// Endpoints requiring highest permissions
GET /dashboard-v2/analytics/comprehensive  // Multiple permissions required
GET /dashboard-v2/export/data              // PERMISSIONS.FINANCIAL.EXPORT_DATA
```

## 🎯 Permission System Usage

### **Using Enhanced Decorators**

```typescript
// Basic permission requirement
@RequirePermissions([PERMISSIONS.DASHBOARD.READ_BASIC])

// Multiple permissions with AND logic (all required)
@RequirePermissions([
  PERMISSIONS.DASHBOARD.READ_FULL,
  PERMISSIONS.FINANCIAL.VIEW_ANALYTICS
])

// Multiple permissions with OR logic (any required)
@RequireAnyPermission(
  PERMISSIONS.FINANCIAL.READ_REVENUE,
  PERMISSIONS.FINANCIAL.READ_REPORTS,
  PERMISSIONS.DASHBOARD.READ_FINANCIAL
)

// Resource-based access control
@Resource('booking')  // Enables resource-specific checks
@AuditAction('VIEW_BOOKING_DETAILS')  // For audit logging
```

### **Available Permission Categories**

```typescript
PERMISSIONS = {
  DASHBOARD: {
    READ_BASIC: 'dashboard:read:basic',
    READ_FULL: 'dashboard:read:full',
    READ_FINANCIAL: 'dashboard:read:financial',
    READ_ANALYTICS: 'dashboard:read:analytics',
    READ_PERFORMANCE: 'dashboard:read:performance'
  },
  SERVICES: {
    READ: 'services:read',
    CREATE: 'services:create',
    UPDATE: 'services:update',
    DELETE: 'services:delete',
    VIEW_ANALYTICS: 'services:view:analytics'
  },
  BOOKINGS: {
    READ_ALL: 'bookings:read:all',
    READ_OWN: 'bookings:read:own',
    READ_ASSIGNED: 'bookings:read:assigned',
    CREATE: 'bookings:create',
    UPDATE: 'bookings:update',
    VIEW_ANALYTICS: 'bookings:view:analytics'
  },
  // ... more categories
}
```

## 🔒 Security Middleware Features

### **Rate Limiting**
- **60 requests per minute** per IP address
- **Automatic blocking** after repeated violations
- **Graduated penalties** for persistent violators

### **Suspicious Activity Detection**
```typescript
// Automatically detects and logs:
- SQL injection attempts
- XSS attack patterns  
- Directory traversal attempts
- Unusual request frequencies
- Access to sensitive paths
```

### **IP Blocking**
```typescript
// Automatic blocking triggers:
- 3+ rate limit violations in 1 hour
- High suspicious activity score (≥5)
- Known malicious patterns
- Blocked for 1-24 hours depending on severity
```

## 📋 Audit Logging

### **What Gets Logged**
```typescript
interface AuditLog {
  userId: string;           // Who performed the action
  action: string;           // What action was performed
  resource: string;         // What resource was accessed
  resourceId?: string;      // Specific resource ID
  result: 'ALLOWED' | 'DENIED' | 'ERROR';
  reason: string;           // Why access was granted/denied
  metadata: {
    requestId: string;      // Unique request identifier
    ip: string;             // Client IP address
    userAgent: string;      // Client user agent
  };
  createdAt: Date;          // When the action occurred
}
```

### **Security Events Logged**
```typescript
// Security event types:
- IP_BLOCKED
- RATE_LIMIT_EXCEEDED  
- SUSPICIOUS_ACTIVITY
- BLOCKED_USER_AGENT
- UNAUTHORIZED_ACCESS
- PERMISSION_DENIED
- RESOURCE_ACCESS_DENIED
```

## 🚀 Implementation Guide

### **1. Database Migration**
```bash
# Run the enhanced security migration
npm run prisma:migrate:deploy

# Verify tables were created
npm run prisma:studio
```

### **2. Update Existing Controllers**
```typescript
// Replace old guards with enhanced security
@UseGuards(JwtAuthGuard, EnhancedPermissionsGuard, ThrottlerGuard)

// Add specific permissions
@RequirePermissions([PERMISSIONS.DASHBOARD.READ_FINANCIAL])

// Add resource tracking
@Resource('financial')
@AuditAction('VIEW_FINANCIAL_SUMMARY')
```

### **3. Configure Role Permissions**
```sql
-- Assign permissions to roles
INSERT INTO role_permission (roleId, permissionId)
SELECT r.id, p.id 
FROM Role r, permission p 
WHERE r.name = 'ADMIN' 
AND p.name IN (
  'dashboard:read:full',
  'financial:read:revenue',
  'users:view:analytics'
);
```

## 📊 Monitoring & Analytics

### **Security Dashboard Endpoints**
```typescript
// Monitor security events
GET /dashboard-v2/security/events
GET /dashboard-v2/security/blocked-ips
GET /dashboard-v2/security/suspicious-activity

// Audit trail access
GET /dashboard-v2/audit/logs
GET /dashboard-v2/audit/user-activity
GET /dashboard-v2/audit/permissions-used
```

### **Performance Metrics**
```typescript
// Track security performance
- Permission check latency
- Cache hit rates for permissions
- Rate limiting effectiveness
- False positive rates for suspicious activity
```

## ⚠️ Security Considerations

### **Deployment Checklist**
- [ ] Database migration completed
- [ ] Redis cache configured for rate limiting
- [ ] Security headers properly set
- [ ] Audit logging storage configured
- [ ] Monitoring alerts set up
- [ ] Role permissions properly assigned
- [ ] Rate limiting thresholds adjusted for production

### **Monitoring Requirements**
- [ ] Set up alerts for security events
- [ ] Monitor audit log storage growth
- [ ] Track permission check performance
- [ ] Regular security event review process
- [ ] IP blocking review and appeals process

### **Compliance Features**
- **GDPR Compliance**: User data access logging
- **SOX Compliance**: Financial data access tracking  
- **HIPAA Ready**: Comprehensive audit trails
- **ISO 27001**: Security event monitoring

## 🔧 Configuration

### **Environment Variables**
```env
# Rate limiting
RATE_LIMIT_TTL=60000           # 1 minute
RATE_LIMIT_MAX=60              # 60 requests per minute

# Security thresholds
MAX_AUTH_FAILURES=5            # Max auth failures per hour
IP_BLOCK_DURATION=3600         # 1 hour IP block duration
SUSPICIOUS_SCORE_THRESHOLD=5   # Threshold for suspicious activity

# Audit logging
AUDIT_LOG_RETENTION_DAYS=90    # Keep audit logs for 90 days
ENABLE_DETAILED_LOGGING=true   # Enable detailed request logging
```

### **Redis Configuration**
```typescript
// Required Redis keys for security features
blocked_ip:{ip}                // Blocked IP addresses
rate_limit:{ip}:{minute}       // Rate limiting counters
rate_violations:{ip}           // Rate violation tracking
request_log:{ip}:{timestamp}   // Request logging
```

## 📞 Support & Troubleshooting

### **Common Issues**
1. **Permission Denied Errors**: Check user role assignments and permission mappings
2. **Rate Limiting**: Verify Redis connection and key expiration
3. **Audit Log Performance**: Monitor database query performance and indexing
4. **False Positives**: Adjust suspicious activity detection thresholds

### **Debug Commands**
```bash
# Check user permissions
npm run debug:user-permissions <userId>

# View recent security events  
npm run debug:security-events

# Check rate limiting status
npm run debug:rate-limits <ip>

# Validate permission assignments
npm run debug:role-permissions
```

---

**This enhanced security system provides enterprise-grade protection while maintaining flexibility and performance. Regular monitoring and maintenance ensure optimal security posture.** 