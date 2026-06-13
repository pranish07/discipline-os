import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DisciplineOS API',
      version: '1.0.0',
      description: 'REST API for personal discipline tracking',
    },
    servers: [
      { url: 'http://localhost:4000', description: 'Development' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        SleepLog: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'string', format: 'uuid' },
            date: { type: 'string', format: 'date' },
            target_wake: { type: 'string', nullable: true },
            target_sleep: { type: 'string', nullable: true },
            actual_wake: { type: 'string', nullable: true },
            actual_sleep: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        DailyTask: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'string', format: 'uuid' },
            date: { type: 'string', format: 'date' },
            task_number: { type: 'integer', minimum: 1, maximum: 3 },
            title: { type: 'string' },
            priority: { type: 'string', enum: ['High', 'Medium', 'Low'] },
            status: { type: 'string', enum: ['pending', 'done'] },
            notes: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        LifeGoal: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string', nullable: true },
            category: { type: 'string' },
            status: { type: 'string', enum: ['active', 'achieved'] },
            achieved_at: { type: 'string', format: 'date-time', nullable: true },
            sort_order: { type: 'integer' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        PMOLog: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'string', format: 'uuid' },
            relapsed_at: { type: 'string', format: 'date-time' },
            notes: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        ExerciseSchedule: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'string', format: 'uuid' },
            day_of_week: { type: 'integer', minimum: 0, maximum: 6 },
            exercise_name: { type: 'string' },
            scheduled_time: { type: 'string', nullable: true },
            is_rest_day: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        ExerciseLog: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'string', format: 'uuid' },
            date: { type: 'string', format: 'date' },
            schedule_id: { type: 'integer' },
            status: { type: 'string', enum: ['done', 'skipped'] },
            notes: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  },
  apis: ['./routes/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
