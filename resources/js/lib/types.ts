export type ApiResponse<T> = {
    message: string;
    data: T;
};

export type ApiError = {
    message: string;
    errors?: Record<string, string[]>;
};

export type Role = 'admin' | 'doctor' | string;

export type User = {
    id?: string;
    _id?: string;
    identifier: string;
    name?: string | null;
    roles: Role[];
    specialtyIds?: string[];
    isActive?: boolean;
};

export type Doctor = User;

export type CalendarScope = 'doctor' | 'specialty' | 'sams';

export type Calendar = {
    id?: string;
    _id?: string;
    scope: CalendarScope;
    doctorId?: string | null;
    specialtyId?: string | null;
    label?: string | null;
    color?: string | null;
    message?: string | null;
    isActive?: boolean;
};

export type AppointmentType = {
    id?: string;
    _id?: string;
    doctorId: string;
    calendarId: string;
    specialtyId?: string | null;
    code: string;
    label: string;
    durationMinutes: number;
    bufferBeforeMinutes?: number;
    bufferAfterMinutes?: number;
    isActive: boolean;
};

export type AvailabilityRule = {
    id?: string;
    _id?: string;
    doctorId: string;
    calendarId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    slotMinutes: number;
    validFrom?: string | null;
    validTo?: string | null;
    timezone?: string | null;
};

export type AvailabilityException = {
    id?: string;
    _id?: string;
    doctorId: string;
    calendarId: string;
    date: string;
    kind: string;
    startTime: string;
    endTime: string;
    reason?: string | null;
};

export type PatientInfo = {
    lastname: string;
    firstname: string;
    phone: string;
    company?: string | null;
};

export type AppointmentTransfer = {
    fromDoctorId?: string;
    toDoctorId?: string;
    reason?: string | null;
    transferredAt?: string;
};

export type Appointment = {
    id?: string;
    _id?: string;
    calendarId: string;
    doctorId: string;
    specialtyId?: string | null;
    appointmentTypeId: string;
    startAt: string;
    endAt: string;
    status: string;
    createdBy?: string | null;
    patient?: PatientInfo;
    transfer?: AppointmentTransfer | null;
};

export type SamsEvent = {
    id?: string;
    _id?: string;
    title: string;
    startAt: string;
    endAt: string;
    location?: string | null;
    description?: string | null;
    source?: string | null;
};

export type BookingTokenResponse = {
    token: string;
    message: string | null;
    expiresAt: string;
};

export type PatientTokenContext = {
    doctorId: string;
    calendarScope: CalendarScope;
    calendarId?: string | null;
    specialtyId?: string | null;
    expiresAt: string;
};

export type AvailabilitySlot = {
    startAt: string;
    endAt: string;
};

export type PageProps = {
    name: string;
    auth: {
        user: User | null;
    };
    sidebarOpen?: boolean;
    [key: string]: unknown;
};
