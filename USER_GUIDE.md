# IronBase User Guide

## A Complete Manual for Gym Owners & Administrators

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Admin Dashboard Overview](#admin-dashboard-overview)
3. [Managing Members](#managing-members)
4. [Class Scheduling](#class-scheduling)
5. [Merchandise Store Management](#merchandise-store-management)
6. [Order Fulfillment](#order-fulfillment)
7. [Reading the Check-In Heatmap](#reading-the-check-in-heatmap)
8. [Billing & Revenue Analytics](#billing--revenue-analytics)
9. [Settings & Demo Data](#settings--demo-data)
10. [Member Features Overview](#member-features-overview)
11. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Accessing the Admin Dashboard

1. Navigate to your IronBase URL
2. Click **"Get Started"** or **"Sign In"** on the landing page
3. Log in with your admin credentials
4. You'll be automatically redirected to `/admin`

> **Note**: Admin access must be granted in the database. New accounts default to "member" role.

### First-Time Setup Checklist

- [ ] Seed demo data (optional, for testing)
- [ ] Add your gym's membership plans
- [ ] Create class schedule
- [ ] Add products to the store
- [ ] Invite staff members

---

## Admin Dashboard Overview

The admin dashboard is your command center. Here's what each section shows:

### Main Dashboard (`/admin`)

| Metric | Description |
|--------|-------------|
| **Total Members** | Count of all registered members |
| **Active Memberships** | Members with current, valid subscriptions |
| **Monthly Revenue** | Revenue from memberships in the current month |
| **Classes This Week** | Number of scheduled classes |

### Revenue Chart

The line chart displays monthly revenue trends over the past 6 months. This helps you:
- Identify seasonal patterns
- Track growth over time
- Spot revenue dips early

### Navigation Sidebar

| Menu Item | Purpose |
|-----------|---------|
| 📊 **Dashboard** | KPI overview and charts |
| 👥 **Members** | Member directory and search |
| 📅 **Classes** | Schedule management |
| 💳 **Billing** | Payment tracking |
| 📦 **Orders** | Merchandise order fulfillment |
| ⚙️ **Settings** | Demo data and configuration |

---

## Managing Members

### Viewing the Member Directory

1. Click **"Members"** in the sidebar
2. Browse the complete member list

### Member Information Displayed

| Column | Description |
|--------|-------------|
| **Member** | Name and avatar initial |
| **Membership** | Current plan name (or "No membership") |
| **Status** | Active (green), Expired (red), Pending (yellow) |
| **Joined** | Account creation date |

### Searching for Members

Use the search box to find members by name:

1. Type the member's name in the search field
2. Results filter in real-time as you type
3. Clear the search to see all members again

### Filtering by Status

Use the dropdown filter to view specific member groups:

- **All Status** - Show everyone
- **Active** - Members with valid subscriptions
- **Expired** - Members whose subscriptions have lapsed
- **Pending** - Members awaiting payment confirmation

### Understanding Member Status

| Status | Badge Color | Meaning |
|--------|-------------|---------|
| Active | 🟢 Green | Paid, can access all features |
| Expired | 🔴 Red | Subscription ended, needs renewal |
| Pending | 🟡 Yellow | Awaiting payment or approval |

---

## Class Scheduling

### Viewing the Class Schedule

1. Click **"Classes"** in the sidebar
2. View all scheduled classes in a list

### Class Information

Each class displays:
- **Class Name** - The workout type (e.g., "Morning HIIT")
- **Instructor** - Assigned trainer
- **Date & Time** - When the class occurs
- **Duration** - Length in minutes
- **Capacity** - Maximum participants
- **Bookings** - Current registration count

### Creating a New Class

1. Click the **"Add Class"** button
2. Fill in the class details:
   - **Name**: Descriptive title
   - **Description**: What members can expect
   - **Trainer**: Select from staff
   - **Start Time**: Date and time picker
   - **Duration**: Length in minutes
   - **Capacity**: Maximum spots
3. Click **"Save"**

### Managing Existing Classes

- **Edit**: Click on a class to modify details
- **Cancel**: Update status if class is cancelled
- **View Bookings**: See who's registered

---

## Merchandise Store Management

### Accessing Product Management

Products are managed through the database. Here's how the store works:

### Understanding the Product Catalog

Products in the store have these properties:

| Field | Description | Example |
|-------|-------------|---------|
| `name` | Product title | "IronBase Logo T-Shirt" |
| `description` | Product details | "Premium cotton blend..." |
| `price` | Price in dollars | 29.99 |
| `image_url` | Product photo URL | "https://..." |
| `category` | Product type | "apparel", "accessories", "supplements" |
| `stock_count` | Available inventory | 50 |

### Adding a New Product

To add products, you'll need to insert records into the `products` table:

```sql
INSERT INTO products (name, description, price, category, stock_count, image_url)
VALUES (
  'IronBase Water Bottle',
  'Stay hydrated with our 32oz insulated steel bottle',
  24.99,
  'accessories',
  100,
  'https://your-image-url.com/bottle.jpg'
);
```

> **Tip**: Use high-quality product images (recommended: 800x800 pixels minimum)

### Product Categories

Organize products using these standard categories:

| Category | Examples |
|----------|----------|
| `apparel` | T-shirts, hoodies, shorts |
| `accessories` | Water bottles, gym bags, towels |
| `supplements` | Protein powder, pre-workout |
| `equipment` | Resistance bands, jump ropes |
| `general` | Default category |

### Managing Inventory

- **Stock Count**: Set initial quantity when adding products
- **Auto-Decrement**: Stock automatically reduces when orders are placed
- **Out of Stock**: Products with `stock_count = 0` show as unavailable
- **Restock**: Update `stock_count` to replenish inventory

### Updating Product Information

```sql
UPDATE products 
SET price = 34.99, stock_count = 75
WHERE name = 'IronBase Logo T-Shirt';
```

### Removing Products

```sql
DELETE FROM products WHERE id = 'product-uuid-here';
```

> **Warning**: This is permanent. Consider setting `stock_count = 0` instead.

---

## Order Fulfillment

### Viewing Orders

1. Click **"Orders"** in the sidebar
2. See all merchandise orders

### Order Information

| Column | Description |
|--------|-------------|
| **Order ID** | Unique identifier |
| **Customer** | Member who placed the order |
| **Items** | Products and quantities |
| **Total** | Order amount |
| **Status** | Current fulfillment state |
| **Date** | When order was placed |

### Order Statuses

| Status | Meaning | Next Action |
|--------|---------|-------------|
| 🟡 **Pending** | Order placed, awaiting processing | Review and confirm |
| 🔵 **Confirmed** | Payment verified | Prepare for shipping |
| 🟣 **Shipped** | Package sent | Provide tracking |
| 🟢 **Delivered** | Customer received | Complete |

### Processing an Order

1. Review order details
2. Verify payment
3. Update status to "Confirmed"
4. Package items
5. Update status to "Shipped"
6. Mark as "Delivered" when complete

### Order Details View

Click on an order to see:
- Customer contact information
- Individual line items
- Price paid for each item
- Shipping address (if collected)

---

## Reading the Check-In Heatmap

The check-in heatmap provides a visual representation of gym attendance, similar to GitHub's contribution graph.

### Accessing the Heatmap

The heatmap appears on:
- **Member Dashboard** - Individual member's activity
- **Admin Dashboard** - Aggregate gym activity (if configured)

### Understanding the Visualization

```
          Jan    Feb    Mar    Apr    May    Jun    ...
Mon  ░░░▓▓░░░░▓▓▓░░░░░▓▓▓▓░░░░░▓▓░░░░░▓▓▓░░
Tue  ░░▓▓▓░░░░▓▓░░░░░▓▓▓▓▓░░░░▓▓▓░░░░▓▓▓▓░
Wed  ░▓▓▓▓░░░▓▓▓░░░░▓▓▓▓▓▓░░░▓▓▓▓░░░▓▓▓▓▓
Thu  ░░▓▓▓░░░░▓▓░░░░░▓▓▓▓▓░░░░▓▓▓░░░░▓▓▓▓░
Fri  ░░░▓▓░░░░▓▓▓░░░░░▓▓▓▓░░░░░▓▓░░░░░▓▓▓░
Sat  ░░░░░░░░░▓░░░░░░░▓▓░░░░░░░▓░░░░░░▓▓░░
Sun  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

### Color Intensity Legend

| Color | Check-ins | Interpretation |
|-------|-----------|----------------|
| ⬜ Empty | 0 | No visits |
| 🟩 Light | 1-2 | Occasional |
| 🟩 Medium | 3-4 | Regular |
| 🟩 Dark | 5+ | Very active |

### What the Heatmap Tells You

1. **Peak Days**: Darker squares = busier days
2. **Patterns**: Identify weekly trends (e.g., Mondays are busy)
3. **Seasonality**: Spot drops during holidays
4. **Member Engagement**: Track individual consistency

### Using Heatmap Insights

| Pattern Observed | Possible Action |
|------------------|-----------------|
| Light weekends | Offer weekend-only promotions |
| Empty mornings | Add early classes |
| Dark specific day | Schedule popular classes |
| Declining activity | Member outreach campaign |

### Hovering for Details

Hover over any square to see:
- Exact date
- Number of check-ins
- (For individual members) Time of check-in

---

## Billing & Revenue Analytics

### Viewing Billing Information

1. Click **"Billing"** in the sidebar
2. Review revenue metrics and transaction history

### Key Metrics

| Metric | Description |
|--------|-------------|
| **Total Revenue** | All-time income from memberships |
| **This Month** | Current month's earnings |
| **Active Subscriptions** | Currently paying members |
| **Average Revenue per Member** | Total ÷ Active members |

### Revenue Breakdown

The billing page shows revenue by:
- **Membership Type**: Which plans generate most income
- **Time Period**: Monthly/quarterly trends
- **Status**: Paid, pending, failed

### Understanding Membership Revenue

Revenue is calculated from `user_memberships`:
```
Revenue = Σ (membership.price for each active subscription)
```

---

## Settings & Demo Data

### Accessing Settings

1. Click **"Settings"** in the sidebar
2. View configuration options

### Seeding Demo Data

The demo data feature populates your database with realistic test data for demonstrations or development.

#### What Gets Created

| Data Type | Quantity | Details |
|-----------|----------|---------|
| **Members** | 30 | Random names, all with "Active" status |
| **Memberships** | 30+ | Distributed across plan types |
| **Revenue** | $50,000+ | Backdated over 6 months |
| **Check-ins** | 200 | Random dates for heatmap |

#### How to Seed Data

1. Go to **Settings**
2. Click **"Seed Demo Data"**
3. Wait for completion (shows loading spinner)
4. Review the summary

#### Seed Results Summary

After seeding, you'll see:
- Members Created: 30
- Membership Records: X
- Estimated Revenue: $XX,XXX
- Check-ins Created: 200

> ⚠️ **Warning**: Seeding creates real database entries. Running multiple times creates duplicates. Only use in testing environments.

---

## Member Features Overview

As an admin, you should understand what your members experience:

### Member Dashboard (`/dashboard`)

Members see:
- Personal check-in heatmap
- Upcoming booked classes
- Quick actions

### My Classes (`/dashboard/classes`)

- View booked classes
- See class details
- Cancel reservations

### Book a Class (`/dashboard/book`)

- Browse available classes
- Filter by type/time
- Reserve spots

### Videos (`/dashboard/videos`)

Netflix-style workout library:
- Browse by category (HIIT, Yoga, etc.)
- Watch on-demand workouts
- Progress tracking
- "Continue Watching" feature

### Store (`/dashboard/store`)

- Browse merchandise
- Add to cart
- Checkout process
- Order history

### Community (`/dashboard/community`)

- Social feed
- Post updates
- Like and engage

### AI Coach (`/dashboard/coach`)

- Chat with AI fitness assistant
- Get workout advice
- Track conversation history

---

## Troubleshooting

### Common Issues

#### "No members showing in directory"

**Cause**: No profiles with role = 'member' exist

**Solution**: 
1. Seed demo data, or
2. Have users register accounts

#### "Member showing as expired but should be active"

**Cause**: `end_date` in `user_memberships` is past

**Solution**: Update the membership end date in the database

#### "Product not showing in store"

**Cause**: Product might have `stock_count = 0`

**Solution**: Increase stock count or verify product exists

#### "Can't access admin dashboard"

**Cause**: Account doesn't have admin role

**Solution**: Update `profiles.role` to 'admin' and add `user_roles` record

#### "Check-in heatmap is empty"

**Cause**: No check-in records for the user

**Solution**: Seed demo data or wait for organic check-ins

#### "Orders not appearing"

**Cause**: RLS policies might be blocking

**Solution**: Verify admin role is properly set

### Getting Help

If issues persist:
1. Check browser console for errors
2. Verify database connection
3. Confirm user roles are correct
4. Review RLS policies

---

## Quick Reference

### Admin URLs

| Page | URL |
|------|-----|
| Dashboard | `/admin` |
| Members | `/admin/members` |
| Classes | `/admin/classes` |
| Billing | `/admin/billing` |
| Orders | `/admin/orders` |
| Settings | `/admin/settings` |

### Member URLs

| Page | URL |
|------|-----|
| Dashboard | `/dashboard` |
| My Classes | `/dashboard/classes` |
| Book Class | `/dashboard/book` |
| Videos | `/dashboard/videos` |
| Store | `/dashboard/store` |
| Community | `/dashboard/community` |
| AI Coach | `/dashboard/coach` |

### Status Colors

| Color | Meaning |
|-------|---------|
| 🟢 Green | Active / Success / Delivered |
| 🟡 Yellow | Pending / Warning |
| 🔴 Red | Expired / Error |
| 🔵 Blue | Confirmed / Info |
| 🟣 Purple | Shipped / In Progress |

---

## Appendix: SQL Cheat Sheet

### View All Members
```sql
SELECT p.full_name, p.role, um.status, m.name as membership
FROM profiles p
LEFT JOIN user_memberships um ON p.id = um.user_id
LEFT JOIN memberships m ON um.membership_id = m.id
WHERE p.role = 'member';
```

### Count Active Memberships
```sql
SELECT COUNT(*) FROM user_memberships WHERE status = 'active';
```

### Calculate Monthly Revenue
```sql
SELECT SUM(m.price) as revenue
FROM user_memberships um
JOIN memberships m ON um.membership_id = m.id
WHERE um.status = 'active'
AND um.start_date >= date_trunc('month', CURRENT_DATE);
```

### Add Admin User
```sql
UPDATE profiles SET role = 'admin' WHERE id = 'user-uuid';
INSERT INTO user_roles (user_id, role) VALUES ('user-uuid', 'admin');
```

### View Recent Orders
```sql
SELECT o.id, p.full_name, o.total, o.status, o.created_at
FROM orders o
JOIN profiles p ON o.user_id = p.id
ORDER BY o.created_at DESC
LIMIT 10;
```

---

*Last Updated: January 2026*
*IronBase v1.0*
