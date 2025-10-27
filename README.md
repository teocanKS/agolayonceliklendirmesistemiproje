# Ağ Olay Önceliklendirme Sistemi Projesi
## Network Event Priority Scoring Dashboard

Karar Destek Sistemlerine uygun Ağ Olay Önceliklendirme Sistemi - A modern network security event prioritization dashboard with MySQL database integration and Vercel deployment support.

## Features

- **Real-time Event Monitoring**: Track and prioritize network security events in real-time
- **Priority Scoring Engine**: Intelligent scoring system based on severity, criticality, attack patterns, volume, and timing
- **KPI Dashboard**: Key Performance Indicators for threat landscape overview
- **Advanced Filtering**: Filter events by severity, status, acknowledgment lane, date range, labels, and destination IP
- **MySQL Database**: Robust data storage with optimized queries and JSON support
- **Vercel Ready**: Optimized for serverless deployment on Vercel platform
- **Mock Data Mode**: Works without database for development and testing

## Tech Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Node.js with ES Modules
- **Database**: MySQL 8.0+ with JSON support
- **Deployment**: Vercel Serverless Functions
- **API**: RESTful endpoints for events and KPIs

## Prerequisites

- Node.js 18+
- MySQL 8.0+ (with JSON support)
- npm or yarn package manager
- Vercel CLI (for local development)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd agolayonceliklendirmesistemiproje
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Database

Create a MySQL database and import the schema:

```bash
mysql -u root -p
```

```sql
CREATE DATABASE network_events CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE network_events;
SOURCE schema.sql;
```

### 4. Configure Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` and set your MySQL connection:

```env
NODE_ENV=development
DATABASE_URL=mysql://username:password@localhost:3306/network_events
```

### 5. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Database Schema

The `events` table stores network security events with the following structure:

- **Event Identification**: `id`, `title`, `detection_rule`
- **Severity & Status**: `severity` (critical/high/medium/low), `status` (active/acknowledged/resolved)
- **Source/Destination**: IP addresses, names, and zones
- **Categorization**: `segment`, `ack_lane`
- **Timestamps**: `event_timestamp`, `created_at`, `updated_at`
- **Flexible Data**: `tags` (JSON array), `metrics` (JSON object)

## API Endpoints

### GET /api/events

Retrieve filtered network events.

**Query Parameters:**
- `from` - Start date (ISO 8601)
- `to` - End date (ISO 8601)
- `label` - Filter by tag/label
- `dst_ip` - Filter by destination IP
- `limit` - Max results (default: 500, max: 1000)

**Response:**
```json
{
  "events": [
    {
      "id": "EVT-240104",
      "title": "Credentialed lateral movement",
      "severity": "critical",
      "status": "active",
      "source": {...},
      "destination": {...},
      "tags": ["lateral", "edr"],
      "metrics": {...}
    }
  ]
}
```

### GET /api/kpi

Retrieve Key Performance Indicators for threat analysis.

**Query Parameters:**
- `from` / `start` - Start date
- `to` / `end` - End date

**Response:**
```json
{
  "total_events": 150,
  "high_priority_count": 23,
  "average_score": 67.5,
  "top_labels": [
    {"label": "lateral", "count": 12},
    {"label": "malware", "count": 8}
  ]
}
```

## Deployment to Vercel

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Configure Database

Set up a MySQL database (recommended providers: PlanetScale, AWS RDS, or DigitalOcean Managed MySQL).

### 3. Set Environment Variables in Vercel

```bash
vercel env add DATABASE_URL
# Enter your production MySQL connection string
# Format: mysql://user:password@host:port/database

vercel env add NODE_ENV
# Enter: production
```

### 4. Deploy

```bash
vercel --prod
```

## Development Without Database

The application includes mock data functionality. If `DATABASE_URL` is not set, the API endpoints will automatically return mock data for development and testing purposes.

## Project Structure

```
.
├── api/                    # Serverless API functions
│   ├── db.js              # MySQL database connection
│   ├── events.js          # Events API endpoint
│   ├── kpi.js             # KPI metrics endpoint
│   └── mock-data.js       # Mock data generator
├── public/                 # Frontend static files
│   ├── index.html         # Main HTML page
│   ├── app.js             # Dashboard JavaScript
│   ├── scoring-engine.js  # Priority scoring algorithm
│   └── styles.css         # Styling
├── schema.sql             # MySQL database schema
├── vercel.json            # Vercel configuration
├── package.json           # Dependencies and scripts
├── .env.example           # Environment variables template
└── README.md              # This file
```

## Configuration Files

### vercel.json

Configures the Vercel deployment with:
- Static file serving for frontend
- Serverless functions for API endpoints
- CORS headers for API access
- Environment variable references

### package.json

Defines:
- Project dependencies (mysql2, vercel)
- Development scripts
- ES Module configuration

## Priority Scoring Algorithm

Events are scored based on weighted factors:

- **Severity** (35%): Critical, High, Medium, Low
- **Criticality** (30%): Asset importance
- **Attack Pattern** (20%): Anomaly vs Normal behavior
- **Volume** (10%): Network traffic volume
- **Timing** (5%): Overnight/off-hours activity

Score ranges:
- **80-100**: BLOCK - Immediate action required
- **60-79**: ESCALATE - Priority investigation
- **0-59**: OBSERVE - Monitor and review

## Performance Optimizations

- Connection pooling for MySQL
- Indexed database queries for fast lookups
- JSON fields for flexible schema evolution
- Serverless function optimization
- Frontend debouncing for search/filters
- Efficient CSS with minimal reflows

## Security Features

- Environment variable protection
- SQL injection prevention (parameterized queries)
- Input validation on all API endpoints
- CORS configuration
- SSL support for production databases

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or contributions, please open an issue on the GitHub repository.

## Changelog

### Version 1.0.0
- Initial release with MySQL support
- Serverless API endpoints
- Real-time dashboard
- Priority scoring engine
- Mock data mode for development
- Vercel deployment configuration
