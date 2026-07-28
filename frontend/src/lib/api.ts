import apiClient from './axios';
import type {
  User, Attendance, AttendanceStats, PaginatedResponse,
  LoginResponse, Student, Teacher, ApiError,
} from './types';

export const api = {
  auth: {
    me: () => apiClient.get<{ user: User }>('/api/me'),
    login: (credentials: { email: string; password: string }) =>
      apiClient.post<LoginResponse>('/api/login', credentials),
    logout: () => apiClient.post<{ message: string }>('/api/logout'),
  },
  students: {
    list: (params?: { page?: number; per_page?: number; search?: string }) =>
      apiClient.get<PaginatedResponse<Student>>('/api/students', { params }),
    get: (id: string | number) => apiClient.get<Student>(`/api/students/${id}`),
    create: (data: Record<string, unknown>) => apiClient.post<{ message: string; student: Student }>('/api/students', data),
    update: (id: string | number, data: Record<string, unknown>) => apiClient.put<{ message: string; student: Student }>(`/api/students/${id}`, data),
  },
  teachers: {
    list: (params?: { page?: number; per_page?: number; search?: string }) =>
      apiClient.get<PaginatedResponse<Teacher>>('/api/teachers', { params }),
    get: (id: string | number) => apiClient.get<Teacher>(`/api/teachers/${id}`),
    create: (data: Record<string, unknown>) => apiClient.post<{ message: string; teacher: Teacher }>('/api/teachers', data),
    update: (id: string | number, data: Record<string, unknown>) => apiClient.put<{ message: string; teacher: Teacher }>(`/api/teachers/${id}`, data),
  },
  principal: {
    dashboard: {
      employees: (params?: { page?: number; per_page?: number }) =>
        apiClient.get<PaginatedResponse<User>>('/api/principal/employees', { params }),
      studentsAtRisk: (params?: { page?: number; per_page?: number }) =>
        apiClient.get<PaginatedResponse<Record<string, unknown>>>('/api/principal/students-at-risk', { params }),
    },
    announcements: {
      list: (params?: { page?: number; per_page?: number }) =>
        apiClient.get<PaginatedResponse<Record<string, unknown>>>('/api/principal/announcements', { params }),
      create: (data: Record<string, unknown>) => apiClient.post<{ message: string; announcement: Record<string, unknown> }>('/api/principal/announcements', data),
    },
    settings: {
      get: () => apiClient.get<Record<string, string>>('/api/principal/settings'),
      update: (settings: Record<string, unknown>) => apiClient.post<{ message: string }>('/api/principal/settings', { settings }),
    },
  },
  attendance: {
    scan: (id_number: string) => apiClient.post<{ message: string; type: string; user: Partial<User> }>('/api/scan', { id_number }),
    today: (params?: { page?: number; per_page?: number }) =>
      apiClient.get<PaginatedResponse<Attendance>>('/api/attendance/today', { params }),
    stats: () => apiClient.get<AttendanceStats>('/api/attendance/stats'),
    log: (id_number: string) => apiClient.post<{ message: string }>('/api/scan/log', { id_number }),
  },
};
