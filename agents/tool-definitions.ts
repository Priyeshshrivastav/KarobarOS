import type { ChatCompletionTool } from 'groq-sdk/resources/chat/completions';

export const CONFIRMATION_REQUIRED_TOOLS = new Set([
  'cancel_appointment',
  'send_customer_message',
]);

export const tools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'create_customer',
      description: 'Add a new customer to the business. Accepts 10-digit Indian phone number.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Customer full name' },
          phone: { type: 'string', description: '10-digit Indian phone number (e.g. 9876543210 or +919876543210)' },
          email: { type: 'string', description: 'Optional email address' },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional tags e.g. ["VIP", "Regular", "Haircut"]',
          },
        },
        required: ['name', 'phone'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_customers',
      description: 'Search existing customers by name or phone number.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Name or phone substring to search' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_customer',
      description: 'Get full profile, notes, and purchase history of a customer by customer_id.',
      parameters: {
        type: 'object',
        properties: {
          customer_id: { type: 'string', description: 'The UUID of the customer' },
        },
        required: ['customer_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_customer',
      description: 'Update customer details (name, phone, email, or tags).',
      parameters: {
        type: 'object',
        properties: {
          customer_id: { type: 'string', description: 'The UUID of the customer' },
          fields: {
            type: 'object',
            description: 'Key-value pairs to update (name, phone, email, tags)',
          },
        },
        required: ['customer_id', 'fields'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_sale',
      description: 'Record a new sale for a customer with itemized details and total amount.',
      parameters: {
        type: 'object',
        properties: {
          customer_id: { type: 'string', description: 'UUID of customer' },
          items: {
            type: 'array',
            description: 'List of purchased items/services',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Item or service name' },
                price: { type: 'number', description: 'Unit price in INR' },
                quantity: { type: 'number', description: 'Quantity (default 1)' },
              },
              required: ['name', 'price'],
            },
          },
          amount: { type: 'number', description: 'Total sale amount in INR' },
          status: {
            type: 'string',
            enum: ['completed', 'pending'],
            description: 'Payment status (completed or pending)',
          },
        },
        required: ['customer_id', 'amount'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_sales_summary',
      description: 'Get sales totals, transaction counts, and revenue summary for today, this week, or this month.',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['today', 'week', 'month'],
            description: 'Time period for the sales report',
          },
        },
        required: ['period'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_pending_payments',
      description: 'List customers with pending payments or unpaid sales (udhaar/credit).',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_appointment',
      description: 'Book an appointment for a customer at a given date/time slot.',
      parameters: {
        type: 'object',
        properties: {
          customer_id: { type: 'string', description: 'UUID of the customer' },
          title: { type: 'string', description: 'Purpose or service title (e.g., Haircut & Facial, Dental Consultation)' },
          starts_at: { type: 'string', description: 'ISO 8601 formatted datetime string for the appointment start' },
          ends_at: { type: 'string', description: 'Optional ISO 8601 formatted datetime string for the appointment end' },
        },
        required: ['customer_id', 'title', 'starts_at'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_appointments',
      description: 'List appointments for a date range (today, tomorrow, or custom ISO dates).',
      parameters: {
        type: 'object',
        properties: {
          date_range: {
            type: 'string',
            enum: ['today', 'tomorrow', 'upcoming'],
            description: 'Filter range for appointments',
          },
        },
        required: ['date_range'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'cancel_appointment',
      description: 'Cancel an existing appointment. Note: Requires explicit user confirmation before execution.',
      parameters: {
        type: 'object',
        properties: {
          appointment_id: { type: 'string', description: 'UUID of the appointment to cancel' },
          reason: { type: 'string', description: 'Optional reason for cancellation' },
        },
        required: ['appointment_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_task',
      description: 'Create a reminder or business to-do task.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Task title or reminder description' },
          due_at: { type: 'string', description: 'Optional ISO datetime when task is due' },
          customer_id: { type: 'string', description: 'Optional UUID of related customer' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'complete_task',
      description: 'Mark a task as completed.',
      parameters: {
        type: 'object',
        properties: {
          task_id: { type: 'string', description: 'UUID of the task' },
        },
        required: ['task_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_business_summary',
      description: 'Get an aggregated overview of the business (today\'s sales, upcoming appointments, pending tasks, total customers).',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'draft_customer_message',
      description: 'Draft a polite follow-up, reminder, or greeting text in Hindi, English, or Hinglish for a customer.',
      parameters: {
        type: 'object',
        properties: {
          customer_id: { type: 'string', description: 'UUID of the customer' },
          purpose: {
            type: 'string',
            description: 'Message intent (e.g. payment reminder, appointment confirmation, thank you note)',
          },
          language: {
            type: 'string',
            enum: ['hinglish', 'hindi', 'english'],
            description: 'Language preference for the draft',
          },
        },
        required: ['customer_id', 'purpose'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_customer_message',
      description: 'Send an external SMS or WhatsApp message to a customer. Note: Always requires explicit confirmation before sending.',
      parameters: {
        type: 'object',
        properties: {
          customer_id: { type: 'string', description: 'UUID of the customer' },
          message: { type: 'string', description: 'The exact text message to dispatch' },
        },
        required: ['customer_id', 'message'],
      },
    },
  },
];
