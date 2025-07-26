# Firestore Index Management

## Overview
This document explains the Firestore indexes configured for the HowUCme app and how to handle index-related errors.

## Current Indexes

### 1. Posts Collection
- **Fields**: `fromUid` (ascending), `createdAt` (descending)
- **Purpose**: Used for fetching user's posts in chronological order
- **Query**: `posts` where `fromUid == userId` order by `createdAt desc`

### 2. Relationships Collection
- **Index 1**: `from` (ascending), `status` (ascending)
- **Index 2**: `to` (ascending), `status` (ascending)  
- **Index 3**: `from` (ascending), `to` (ascending), `status` (ascending)
- **Purpose**: Used for relationship queries with status filtering

### 3. Conversations Collection
- **Fields**: `participants` (array-contains), `updatedAt` (descending)
- **Purpose**: Used for fetching user's conversations ordered by recent activity

### 4. Messages Collection
- **Fields**: `conversationId` (ascending), `createdAt` (descending)
- **Purpose**: Used for fetching messages in a conversation chronologically

### 5. Achievements Collection
- **Fields**: `userId` (ascending), `unlockedAt` (descending)
- **Purpose**: Used for fetching user achievements by unlock date

### 6. Celebrations Collection
- **Fields**: `userId` (ascending), `createdAt` (descending)
- **Purpose**: Used for fetching user celebrations chronologically

### 7. Families Collection
- **Fields**: `isPublic` (ascending), `createdAt` (descending)
- **Purpose**: Used for public family discovery

### 8. Communities Collection
- **Fields**: `isPublic` (ascending), `lastActivity` (descending)
- **Purpose**: Used for public community discovery by activity

## How to Handle Index Errors

When you encounter a Firestore index error:

1. **Error Message**: Look for messages like "The query requires an index"
2. **Click the Link**: Firebase provides a direct link to create the index
3. **Automatic Creation**: Click the link to automatically create the index
4. **Manual Creation**: Or add the index to `firestore.indexes.json` and deploy

### Manual Index Creation Steps

1. Add the index configuration to `firestore.indexes.json`
2. Run: `firebase deploy --only firestore:indexes`
3. Wait for deployment to complete (indexes can take time to build)

### Example Index Configuration

```json
{
  "collectionGroup": "collection_name",
  "queryScope": "COLLECTION",
  "fields": [
    {
      "fieldPath": "field1",
      "order": "ASCENDING"
    },
    {
      "fieldPath": "field2", 
      "order": "DESCENDING"
    }
  ]
}
```

## Common Query Patterns That Need Indexes

1. **Multiple where clauses**: `where(field1).where(field2)`
2. **Where + OrderBy**: `where(field1).orderBy(field2)`
3. **Array-contains + OrderBy**: `where(field, 'array-contains', value).orderBy(field2)`
4. **In queries + Other filters**: `where(field, 'in', array).where(field2)`

## Development Tips

1. **Local Development**: Use the Firestore emulator to avoid index issues during development
2. **Testing**: Test queries in Firebase Console before implementing
3. **Monitoring**: Check Firebase Console for index build status
4. **Performance**: Monitor query performance and optimize indexes as needed

## Deployment Commands

```bash
# Deploy only indexes
firebase deploy --only firestore:indexes

# Deploy indexes and rules
firebase deploy --only firestore

# Check current project
firebase projects:list

# Switch project
firebase use project-id
```

## Index Build Time

- Simple indexes: Usually build in seconds to minutes
- Complex indexes: Can take several minutes to hours for large datasets
- You can monitor build progress in the Firebase Console

## Troubleshooting

If you still get index errors after deployment:

1. Check Firebase Console for index build status
2. Ensure the query matches the index exactly
3. Verify field names and types match
4. Wait for index build completion (check status in console)
5. Clear browser cache and retry
