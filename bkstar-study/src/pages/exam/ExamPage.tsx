import React, { useCallback, useEffect, useState } from "react";
import { Box, Alert } from "@mui/material";
import { useParams, useNavigate, Outlet, useLocation } from "react-router-dom";
import { examGroupApi } from "@/api/examGroup.api";
import { examApi } from "@/api/exam.api";
import ExamDialog from "@/components/dialog/ExamDialog";
import { LoadingData } from "@/components/common/LoadingData";
import { ExamHeader,ExamGrid, ResultGroup } from "@/components/exam";
import type { ExamGroup, ExamItem } from "@/types";
import {useAuth} from "@/contexts";

const ExamPage: React.FC = () => {
    const { classId, examGroupId } = useParams<{ classId: string; examGroupId: string }>();
    const groupId = Number(examGroupId);
    const navigate = useNavigate();
    const location = useLocation();

    const { isTeacher } = useAuth();

    const [examGroup, setExamGroup] = useState<ExamGroup | null>(null);
    const [exams, setExams] = useState<ExamItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogLoading, setDialogLoading] = useState(false);

    const fetchExamGroup = useCallback(async (id: number) => {
        try {
            const res = await examGroupApi.getExamGroup(id);
            setExamGroup(res);
        } catch (err) {
            console.error("Không thể lấy thông tin nhóm bài thi:", err);
            setError("Không thể tải thông tin nhóm bài thi.");
        }
    }, []);

    console.log('isTeacher', isTeacher, exams, examGroup);

    const fetchExams = useCallback(async (id: number) => {
        const res = await examApi.getExams(id);
        setExams(res);
    }, []);

    useEffect(() => {
        setExamGroup(null);
        setExams([]);
        setError(null);
        setLoading(true);

        if (!isFinite(groupId) || groupId <= 0) {
            setError("ID nhóm bài thi không hợp lệ.");
            setLoading(false);
            return;
        }

        const load = async () => {
            await Promise.all([fetchExamGroup(groupId), fetchExams(groupId)]);
            setLoading(false);
        };
        load();
    }, [groupId, fetchExamGroup, fetchExams]);

    const students = (examGroup?.users ?? []).map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
    }));

    const handleEditGroup = () => setDialogOpen(true);

    const handleUpdateGroup = async (payload: { name: string; startDate: string; awaitTime: number }) => {
        setDialogLoading(true);
        try {
            await (examGroupApi as any).updateExamGroup?.(groupId, {
                name: payload.name,
                class_id: classId,
                start_time: payload.startDate,
                await_time: Number(payload.awaitTime),
                is_once: true,
                is_save_local: true,
            });
            await fetchExamGroup(groupId);
            setDialogOpen(false);
        } catch (err) {
            console.error("Cập nhật nhóm thất bại:", err);
            throw err;
        } finally {
            setDialogLoading(false);
        }
    };

    const handleDeleteGroup = async () => {
        if (!confirm("Xác nhận xóa nhóm bài thi?")) return;
        try {
            await (examGroupApi as any).deleteExamGroup?.(groupId);
            navigate(-1);
        } catch (err) {
            console.error("Xóa nhóm thất bại:", err);
            alert("Xóa nhóm thất bại");
        }
    };

    if (loading) return <LoadingData />;

    if (error) {
        return (
            <Box p={2}>
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
            </Box>
        );
    }

    if (!examGroup) {
        return (
            <Box p={2}>
                <Alert severity="warning">Không tìm thấy thông tin nhóm bài thi.</Alert>
            </Box>
        );
    }

    return (
        <Box p={2}>
            <ExamHeader
                examGroup={examGroup}
                onEdit={handleEditGroup}
                onDelete={handleDeleteGroup}
                isTeacher={isTeacher}
            />

            <ExamGrid
                classId={classId}
                groupId={groupId}
                exams={exams}
                isTeacher={isTeacher}
                onReload={() => fetchExams(groupId)}
            />

            {isTeacher && (
                <ResultGroup
                    students={students}
                    onViewDetail={(studentId) => {
                        // navigate(`/exam-group/${groupId}/student/${studentId}`);
                        navigate(`${location.pathname}/markingStudent/${studentId}`);
                    }}
                />
            )}

            <ExamDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSubmit={handleUpdateGroup}
                loading={dialogLoading}
                initialData={{
                    name: examGroup.name,
                    awaitTime: examGroup.await_time ?? 0,
                    startDate: (examGroup.start_time ?? new Date().toISOString().split("T")[0]).split("T")[0],
                }}
                dialogTitle="Chỉnh sửa nhóm bài thi"
            />

            <Outlet />
        </Box>
    );
};

export default ExamPage;