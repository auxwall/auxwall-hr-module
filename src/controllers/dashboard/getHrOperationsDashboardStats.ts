import { Model, ModelStatic, Op } from 'sequelize';
import { models } from '../../index';

export default async function getHrOperationsDashboardStats(
  companyId: number,
) {
  const Task = models.employeeTask as ModelStatic<Model>;
  const LeaveRequest = models.leaveRequest as ModelStatic<Model>;
  const Training = models.trainingRecord as ModelStatic<Model>;
  const Review = models.performanceReview as ModelStatic<Model>;
  const PublicHoliday = models.publicHoliday as ModelStatic<Model>;
  const today = new Date().toISOString().slice(0, 10);
  const nextMonth = new Date(Date.now() + 30 * 86400000)
    .toISOString()
    .slice(0, 10);

  const [
    workTasksOpen,
    workTasksOverdue,
    pendingLeave,
    trainingOverdue,
    reviewsOpen,
    upcomingHolidays,
  ] = await Promise.all([
    Task.count({
      where: {
        companyId,
        phase: 'work',
        status: { [Op.notIn]: ['completed', 'waived'] },
      },
    }),
    Task.count({
      where: {
        companyId,
        phase: 'work',
        dueDate: { [Op.lt]: today },
        status: { [Op.notIn]: ['completed', 'waived'] },
      },
    }),
    LeaveRequest.count({
      where: { companyId, status: 'pending' },
    }),
    Training.count({
      where: {
        companyId,
        status: { [Op.notIn]: ['completed', 'cancelled'] },
        dueDate: { [Op.lt]: today },
      },
    }),
    Review.count({
      where: {
        companyId,
        status: { [Op.notIn]: ['completed'] },
      },
    }),
    PublicHoliday.count({
      where: {
        companyId,
        holidayDate: {
          [Op.gte]: today,
          [Op.lte]: nextMonth,
        },
      },
    }),
  ]);

  return {
    workTasksOpen,
    workTasksOverdue,
    pendingLeave,
    trainingOverdue,
    reviewsOpen,
    upcomingHolidays,
  };
}
