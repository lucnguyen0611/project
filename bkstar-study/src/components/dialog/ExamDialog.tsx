import React, { useEffect, useState } from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, IconButton, CircularProgress, Box, Alert
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

interface DialogPayload {
    name: string;
    awaitTime: number; // minutes
    startDate: string; // YYYY-MM-DD
}

interface Props {
    open: boolean;
    onClose: () => void;
    onSubmit: (payload: DialogPayload) => Promise<void>;
    loading?: boolean;
    initialData?: { name?: string; awaitTime?: number; startDate?: string }; // values as strings for inputs
    dialogTitle?: string;
}

export default function ExamDialog({ open, onClose, onSubmit, loading = false, initialData, dialogTitle }: Props) {
    const [formData, setFormData] = useState({ name: "", awaitTime: 0, startDate: "" });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            // Prefill only when dialog opens
            setFormData({
                name: initialData?.name ?? "",
                awaitTime: (initialData?.awaitTime ?? 0) / 60,
                startDate: initialData?.startDate ?? "",
            });
            setError(null);
        } else {
            // clear on close
            setFormData({ name: "", awaitTime: 0, startDate: "" });
            setError(null);
            setSubmitting(false);
        }
    }, [open, initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            if (!formData.name.trim()) {
                setError("Tên không được để trống");
                setSubmitting(false);
                return;
            }
            if (!formData.startDate) {
                setError("Vui lòng chọn ngày bắt đầu");
                setSubmitting(false);
                return;
            }

            const payload = {
                name: formData.name.trim(),
                // awaitTime: Number.parseInt(formData.awaitTime as string, 10) || 0,
                awaitTime: (formData.awaitTime) * 60,
                startDate: formData.startDate,
            };

            await onSubmit(payload);
            // parent decides to close dialog on success
        } catch (err: any) {
            console.error("Dialog submit error:", err);
            setError(err?.message || "Thao tác thất bại");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>
                {dialogTitle ?? "Tạo / Chỉnh sửa"}
                <IconButton onClick={onClose} sx={{ position: "absolute", right: 8, top: 8 }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <form onSubmit={handleSubmit}>
                <DialogContent dividers>
                    {error && <Box mb={2}><Alert severity="error">{error}</Alert></Box>}

                    <TextField fullWidth margin="normal" label="Tên" name="name" value={formData.name} onChange={handleChange} required />
                    <TextField fullWidth margin="normal" label="Thời gian chờ (phút)" name="awaitTime" value={formData.awaitTime} onChange={handleChange} required type="number" />
                    <TextField fullWidth margin="normal" label="Ngày bắt đầu" name="startDate" type="date" value={formData.startDate} onChange={handleChange} required InputLabelProps={{ shrink: true }} />
                </DialogContent>

                <DialogActions>
                    <Button onClick={onClose} disabled={loading || submitting}>Hủy</Button>
                    <Button type="submit" variant="contained" disabled={loading || submitting} sx={{ backgroundColor: "#1976d2", "&:hover": { backgroundColor: "#1565c0" } }}>
                        {(loading || submitting) ? <CircularProgress size={22} color="inherit" /> : "Lưu"}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
