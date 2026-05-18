# DevPulse Analytics Engine

A Python Flask microservice for analyzing commit patterns and programming language distribution in GitHub repositories.

## Features

- **Commit Analytics**: Peak hours, peak days, streaks, frequency distributions
- **Language Analytics**: Language distribution, diversity metrics, statistics
- **Fast**: Optimized with pandas and numpy for data processing
- **Stateless**: No database dependencies, perfect for containerized deployment

## Setup

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run the app
FLASK_ENV=development python app.py
```

The service will start on `http://localhost:5000`

### Docker

```bash
# Build image
docker build -t devpulse-analytics .

# Run container
docker run -p 5000:5000 devpulse-analytics
```

## Endpoints

### Health Check
```
GET /health
```
Returns `{"status": "ok", "service": "analytics"}` if the service is running.

### Service Info
```
GET /info
```
Returns service metadata and available endpoints.

### Analyze Commits
```
POST /analyse/commits
```

**Input:**
```json
{
  "commits": [
    {
      "sha": "abc123def456",
      "committed_at": "2025-01-15T14:30:00Z",
      "additions": 120,
      "deletions": 45
    }
  ]
}
```

**Output:**
```json
{
  "peak_hour": 14,
  "peak_day": "Wednesday",
  "avg_daily_commits": 3.4,
  "longest_streak_days": 12,
  "current_streak_days": 4,
  "total_additions": 4500,
  "total_deletions": 1200,
  "commit_frequency_by_hour": {
    "0": 2,
    "1": 0,
    "14": 12,
    ...
  },
  "commit_frequency_by_day": {
    "Monday": 12,
    "Tuesday": 8,
    ...
  }
}
```

### Analyze Languages
```
POST /analyse/languages
```

**Input:**
```json
{
  "repositories": [
    {
      "name": "devpulse",
      "language": "TypeScript",
      "bytes": 500000
    },
    {
      "name": "analytics-engine",
      "language": "Python",
      "bytes": 300000
    }
  ]
}
```

**Output:**
```json
{
  "distribution": {
    "TypeScript": 62.5,
    "Python": 37.5
  },
  "stats": {
    "TypeScript": {
      "percentage": 62.5,
      "bytes": 500000,
      "repo_count": 1
    },
    "Python": {
      "percentage": 37.5,
      "bytes": 300000,
      "repo_count": 1
    }
  },
  "top_languages": [
    {
      "language": "TypeScript",
      "percentage": 62.5,
      "bytes": 500000,
      "repo_count": 1
    }
  ],
  "diversity": {
    "total_languages": 2,
    "primary_language": "TypeScript",
    "primary_percentage": 62.5,
    "is_polyglot": false
  }
}
```

## Analytics Details

### Commit Analytics

- **peak_hour**: Hour of day (0-23) with most commits
- **peak_day**: Day of week with most commits
- **avg_daily_commits**: Average commits per day (rounded to 2 decimals)
- **longest_streak_days**: Longest consecutive days with commits (all time)
- **current_streak_days**: Consecutive days with commits (from today backwards)
- **total_additions**: Total lines added across all commits
- **total_deletions**: Total lines deleted across all commits
- **commit_frequency_by_hour**: Commit count for each hour (0-23)
- **commit_frequency_by_day**: Commit count for each day of week

### Language Analytics

- **distribution**: Simple percentage breakdown by language
- **stats**: Detailed per-language statistics (percentage, bytes, repo count)
- **top_languages**: Top 5 languages by usage
- **diversity**: Metrics on language diversity and polyglot status

## Architecture

```
services/
├── commit_analyser.py    # Streak, peak, frequency calculations
└── language_analyser.py  # Language distribution analysis

app.py                     # Flask app & endpoints
requirements.txt          # Python dependencies
Dockerfile               # Container configuration
```

## Performance

- Handles 1000+ commits efficiently with pandas
- Streaks calculated in O(n log n) time
- Language analysis in O(n) time

## Environment Variables

- `FLASK_ENV`: `development` or `production` (default: production)
- `PORT`: Port to run on (default: 5000)

## Integration with NestJS

The NestJS backend (`AnalyticsModule`) acts as a proxy:

1. Frontend calls `GET /analytics/me`
2. NestJS fetches user's commits from database
3. NestJS sends commits to Flask `/analyse/commits`
4. Flask returns analytics
5. NestJS returns analytics to frontend

## Future Enhancements

- Time-series trends (commits per month, language drift over time)
- Anomaly detection (unusual commit patterns)
- Comparative analytics (team vs individual, org trends)
- Caching layer for frequent queries
- GraphQL endpoint support
