/**
 * API Client for ArtisanConnect SA
 * Handles all HTTP requests to the backend API
 */

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: 'client' | 'artisan' | 'logistics' | 'admin';
  verified: boolean;
  rating: string | null;
  createdAt: string;
  artisanProfile?: ArtisanProfile;
}

export interface ArtisanProfile {
  id: string;
  userId: string;
  category: string;
  bio: string | null;
  skills: string[] | null;
  certifications: string[] | null;
  yearsExperience: number | null;
  location: string | null;
  verified: boolean;
  createdAt: string;
}

export interface Job {
  id: string;
  clientId: string;
  title: string;
  description: string;
  category: string;
  location: string;
  budget: string | null;
  status: 'open' | 'quoted' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
  needsLogistics: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Quote {
  id: string;
  jobId: string;
  artisanId: string;
  amount: string;
  message: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface Payment {
  id: string;
  jobId: string;
  clientId: string;
  artisanId: string;
  totalAmount: string;
  platformFee: string;
  artisanAmount: string;
  status: 'pending' | 'held_escrow' | 'released' | 'refunded';
  escrowReleaseDate: string | null;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  jobId: string | null;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface Review {
  id: string;
  jobId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface Dispute {
  id: string;
  jobId: string;
  clientId: string;
  artisanId: string;
  issue: string;
  description: string | null;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  resolution: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

class ApiClient {
  private baseUrl = '/api';

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Important for session cookies
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'An error occurred' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Authentication
  async signup(data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    role: 'client' | 'artisan' | 'logistics';
    artisanProfile?: {
      category: string;
      bio?: string;
      skills?: string[];
      certifications?: string[];
      yearsExperience?: number;
      location?: string;
    };
  }): Promise<User> {
    return this.request<User>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(email: string, password: string): Promise<User> {
    return this.request<User>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout(): Promise<{ message: string }> {
    return this.request('/auth/logout', { method: 'POST' });
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // Jobs
  async createJob(data: {
    title: string;
    description: string;
    category: string;
    location: string;
    budget?: string;
    needsLogistics?: boolean;
  }): Promise<Job> {
    return this.request<Job>('/jobs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getOpenJobs(): Promise<Job[]> {
    return this.request<Job[]>('/jobs/open');
  }

  async getMyJobs(): Promise<Job[]> {
    return this.request<Job[]>('/jobs/my-jobs');
  }

  async getJob(id: string): Promise<Job> {
    return this.request<Job>(`/jobs/${id}`);
  }

  async updateJob(id: string, updates: Partial<Job>): Promise<Job> {
    return this.request<Job>(`/jobs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // Quotes
  async createQuote(data: {
    jobId: string;
    amount: string;
    message?: string;
  }): Promise<Quote> {
    return this.request<Quote>('/quotes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getJobQuotes(jobId: string): Promise<Quote[]> {
    return this.request<Quote[]>(`/jobs/${jobId}/quotes`);
  }

  async getMyQuotes(): Promise<Quote[]> {
    return this.request<Quote[]>('/quotes/my-quotes');
  }

  async acceptQuote(quoteId: string): Promise<Quote> {
    return this.request<Quote>(`/quotes/${quoteId}/accept`, {
      method: 'PATCH',
    });
  }

  // Payments
  async getJobPayments(jobId: string): Promise<Payment[]> {
    return this.request<Payment[]>(`/jobs/${jobId}/payments`);
  }

  async releasePayment(paymentId: string): Promise<Payment> {
    return this.request<Payment>(`/payments/${paymentId}/release`, {
      method: 'PATCH',
    });
  }

  async getPlatformRevenue(): Promise<{ revenue: number }> {
    return this.request<{ revenue: number }>('/admin/revenue');
  }

  // Messages
  async sendMessage(data: {
    recipientId: string;
    content: string;
    jobId?: string;
  }): Promise<Message> {
    return this.request<Message>('/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getConversation(userId: string): Promise<Message[]> {
    return this.request<Message[]>(`/messages/${userId}`);
  }

  async getConversations(): Promise<Message[]> {
    return this.request<Message[]>('/conversations');
  }

  async markMessageAsRead(messageId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/messages/${messageId}/read`, {
      method: 'PATCH',
    });
  }

  // Reviews
  async createReview(data: {
    jobId: string;
    revieweeId: string;
    rating: number;
    comment?: string;
  }): Promise<Review> {
    return this.request<Review>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUserReviews(userId: string): Promise<Review[]> {
    return this.request<Review[]>(`/users/${userId}/reviews`);
  }

  // Disputes
  async createDispute(data: {
    jobId: string;
    clientId: string;
    artisanId: string;
    issue: string;
    description?: string;
  }): Promise<Dispute> {
    return this.request<Dispute>('/disputes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getDisputes(): Promise<Dispute[]> {
    return this.request<Dispute[]>('/admin/disputes');
  }

  async updateDispute(id: string, updates: Partial<Dispute>): Promise<Dispute> {
    return this.request<Dispute>(`/admin/disputes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // Artisans
  async getArtisansByCategory(category: string): Promise<ArtisanProfile[]> {
    return this.request<ArtisanProfile[]>(`/artisans?category=${encodeURIComponent(category)}`);
  }

  async getArtisanProfile(userId: string): Promise<ArtisanProfile> {
    return this.request<ArtisanProfile>(`/artisans/${userId}/profile`);
  }
}

export const api = new ApiClient();
