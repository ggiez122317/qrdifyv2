export interface User {
  id: number;
  name: string;
  email: string;
  id_number: string;
  photo_url: string | null;
  roles: string[];
  is_blocked: boolean;
  student_profile?: StudentProfile | null;
  teacher_profile?: TeacherProfile | null;
  created_at: string;
}

export interface StudentProfile {
  id: number;
  grade: string | null;
  section: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  teacher_id: number | null;
  teacher?: { id: number; name: string } | null;
}

export interface TeacherProfile {
  id: number;
  position: string | null;
  subject: string | null;
  contact_number: string | null;
}

export interface Attendance {
  id: number;
  user_id: number;
  date: string;
  time_in: string | null;
  time_out: string | null;
  status: 'present' | 'late' | 'absent';
  am_status?: string | null;
  pm_status?: string | null;
  remarks?: string | null;
  user?: User;
}

export interface AttendanceStats {
  overview: {
    present: number;
    late: number;
    absent: number;
  };
  distribution: {
    students: number;
    teachers: number;
  };
  trend: { name: string; value: number }[];
  total_users: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    name: string;
    email: string;
    roles: string[];
  };
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

export interface Student {
  id: number;
  name: string;
  lrn: string;
  email: string;
  status: string;
  photo_url: string | null;
  student_profile: StudentProfile | null;
}

export interface Teacher {
  id: number;
  name: string;
  employee_id: string;
  email: string;
  status: string;
  photo_url: string | null;
  teacher_profile: TeacherProfile | null;
}
