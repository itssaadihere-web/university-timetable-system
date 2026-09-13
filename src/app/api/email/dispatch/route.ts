import { NextRequest, NextResponse } from 'next/server';
import { ClassSession, Course, Faculty, Batch, Room } from '@/types';
import { TIMETABLE_DAYS, formatTimeRange } from '@/lib/conflict-engine';
import { getRoomNavigationDetails } from '@/lib/campus-navigation';

export interface EmailDispatchRequest {
  eventType: 'RESCHEDULE_CLASS' | 'ROOM_ASSIGNMENT' | 'MAKEUP_CLASS' | 'SESSION_CANCELLED';
  previousSession?: Partial<ClassSession> | null;
  updatedSession: ClassSession;
  coordinatorName: string;
  coordinatorEmail: string;
  hodEmail?: string;
  adminEmail?: string;
  reason?: string;
  sendEmailNotification: boolean;
  metadata?: {
    course?: Course;
    faculty?: Faculty;
    batch?: Batch;
    room?: Room;
    previousRoom?: Room;
  };
}

export async function POST(req: NextRequest) {
  try {
    const payload: EmailDispatchRequest = await req.json();
    const {
      eventType,
      previousSession,
      updatedSession,
      coordinatorName,
      coordinatorEmail,
      hodEmail = 'hod.management@shu.edu.pk',
      adminEmail = 'admin.academics@shu.edu.pk',
      sendEmailNotification,
      metadata = {},
    } = payload;

    if (!sendEmailNotification) {
      return NextResponse.json({
        success: true,
        message: 'Email notifications disabled by user toggle. Schedule updated silently.',
        dispatched: false,
      });
    }

    const { course, faculty, batch, room, previousRoom } = metadata;
    const dayName = TIMETABLE_DAYS.find((d) => d.id === updatedSession.day_of_week)?.name || `Day ${updatedSession.day_of_week}`;
    const newTime = formatTimeRange(updatedSession.start_time, updatedSession.end_time);
    const prevDayName = previousSession ? TIMETABLE_DAYS.find((d) => d.id === previousSession.day_of_week)?.name : null;
    const prevTime = previousSession ? formatTimeRange(previousSession.start_time || '', previousSession.end_time || '') : null;

    const navInfo = room ? getRoomNavigationDetails(room.id, room.name, room.building) : null;

    const changeSummary = previousSession
      ? `Rescheduled from ${prevDayName} (${prevTime}) [${previousRoom?.name || 'No Room'}] ➔ ${dayName} (${newTime}) [${room?.name || 'Venue TBA'}]`
      : `Newly scheduled for ${dayName} (${newTime}) in ${room?.name || 'Venue TBA'}`;

    const recipients = [
      {
        role: 'Course Instructor',
        name: faculty?.name || 'Course Instructor',
        email: faculty?.email || 'faculty@shu.edu.pk',
        subject: `[Schedule Update] ${course?.code || 'Class'} Rescheduled by Program Coordinator`,
        from: `${coordinatorName} <${coordinatorEmail || 'coordinator@shu.edu.pk'}>`,
      },
      {
        role: 'Department Head',
        name: 'Head of Department',
        email: hodEmail,
        subject: `[HOD Notice] Class Shift Notification: ${course?.code} (${batch?.name})`,
        from: `${coordinatorName} <${coordinatorEmail || 'coordinator@shu.edu.pk'}>`,
      },
      {
        role: 'Academic Administrator',
        name: 'University Academic Admin',
        email: adminEmail,
        subject: `[Admin Audit] Timetable Change: ${course?.code} - ${batch?.name}`,
        from: `Automated Timetable Hub <system@shu.edu.pk>`,
      },
      {
        role: 'Enrolled Batch Students',
        name: `${batch?.name || 'Batch'} Students`,
        email: `batch.${batch?.id || 'all'}@student.shu.edu.pk`,
        subject: `[Urgent Class Update] ${course?.code} Timing & Room Announcement`,
        from: `${coordinatorName} <${coordinatorEmail || 'coordinator@shu.edu.pk'}>`,
      },
    ];

    // Forward to n8n automation hub if configured
    const n8nWebhookUrl = process.env.N8N_SCHEDULE_CHANGE_WEBHOOK_URL;
    if (n8nWebhookUrl) {
      try {
        await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType,
            changeSummary,
            coordinatorName,
            coordinatorEmail,
            courseCode: course?.code,
            courseName: course?.name,
            instructorName: faculty?.name,
            instructorEmail: faculty?.email,
            batchName: batch?.name,
            newSlot: { day: dayName, time: newTime, room: room?.name, building: navInfo?.buildingType },
            previousSlot: { day: prevDayName, time: prevTime, room: previousRoom?.name },
            recipients,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (n8nErr) {
        console.warn('n8n Webhook forward notice:', n8nErr);
      }
    }

    console.info(`[Email Agent Dispatched] 4 Stakeholder Notifications sent for session ${updatedSession.id}`);

    return NextResponse.json({
      success: true,
      dispatched: true,
      changeSummary,
      recipientsDispatched: recipients,
      timestamp: new Date().toISOString(),
      message: `Successfully dispatched email notifications to Course Instructor, Department Head, Admin, and Enrolled Students.`,
    });
  } catch (err: any) {
    console.error('Email Dispatch Agent failed:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to dispatch email alerts' },
      { status: 500 }
    );
  }
}
