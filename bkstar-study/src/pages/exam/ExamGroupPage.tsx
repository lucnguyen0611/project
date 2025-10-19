import { useEffect, useState, useCallback } from "react";
import { Alert, Box } from "@mui/material";
import { useParams, Outlet } from "react-router-dom";
import { examGroupApi } from "@/api/examGroup.api";
import { useToast, useAuth } from "@/contexts";
import { ExamGroupGrid, ExamGroupHeader } from "@/components/exam";
import ExamDialog from "@/components/dialog/ExamDialog";
import type { ExamGroup } from "@/types";
import {LoadingData} from "@/components/common/LoadingData.tsx";

export default function ExamGroupPage(){
    const { classId: classIdParam } = useParams<{ classId?: string }>();
    const classId = Number(classIdParam ?? NaN);
    const { showToast } = useToast();
    const { user } = useAuth();
    const isTeacher = user?.role === "teacher" || user?.role === "admin";

    const [groups, setGroups] = useState<ExamGroup[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [dialogOpen, setDialogOpen] = useState<boolean>(false);

    const fetchGroups = useCallback(async () => {
        if (!isFinite(classId) || classId <= 0) {
            setError("classId không hợp lệ");
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await examGroupApi.getExamGroupByClassId(classId);
            setGroups(res ?? []);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Không thể tải nhóm bài thi");
        } finally {
            setLoading(false);
        }
    }, [classId]);

    useEffect(() => {
        fetchGroups();
    }, [fetchGroups]);

    const handleCreate = async (payload: { name: string; startDate: string; awaitTime: number }) => {
        setLoading(true);
        try {
            await examGroupApi.createExamGroup({
                name: payload.name,
                class_id: classId,
                start_time: payload.startDate,
                await_time: payload.awaitTime,
                is_once: true,
                is_save_local: true,
            });
            showToast?.("Tạo nhóm bài thi thành công");
            await fetchGroups();
            setDialogOpen(false);
        } catch (err: any) {
            console.error(err);
            showToast?.(err.message || "Tạo nhóm bài thất bại");
            throw err;
        } finally {
            setLoading(false);
        }
    };
    // client-side filter (small data). If data large -> change to server-side search.
    const filtered = (groups || []).filter((g) =>
        g.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <LoadingData/>
        );
    }

    return (
        <Box>
            <ExamGroupHeader
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                isTeacher={isTeacher}
                onCreateClick={() => setDialogOpen(true)}
            />

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

            <ExamGroupGrid
                groups={filtered}
                searchTerm={searchTerm}
                // onEnterExamGroup={handleEnterExamGroup}
            />

            <ExamDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSubmit={handleCreate}
                loading={loading}
                dialogTitle="Tạo bài thi"
            />

            <Outlet />
        </Box>
    );
}
