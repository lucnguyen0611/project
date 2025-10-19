import React from "react";
import { Paper, Grid, Typography, Button, Box } from "@mui/material";
import type { ExamGroup } from "@/types";

interface ExamGroupHeaderProps {
    examGroup: ExamGroup;
    onEdit: () => void;
    onDelete: () => void;
    isTeacher: boolean;
}

export const ExamHeader: React.FC<ExamGroupHeaderProps> = ({ examGroup, onEdit, onDelete, isTeacher }) => {
    return (
        <Paper
            variant="outlined"
            sx={{
                borderRadius: 2,
                p: { xs: 2, md: 3 },
                mb: 4,
                border: "1px solid",
                borderColor: "#00bcd4",
                backgroundColor: "#fafcff", // nhẹ nhàng
            }}
        >
            <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, md: 8 }}>
                    <Box>
                        <Typography sx={{ fontWeight: 700, mb: 0.5, color: "text.primary" }}>
                            Tên bài thi: <Box component="span" sx={{ fontWeight: 700, ml: 0.5 }}>{examGroup.name}</Box>
                        </Typography>

                        <Typography sx={{ fontSize: 14, color: "text.secondary", mb: 0.5 }}>
                            Ngày bắt đầu: {examGroup.start_time ? new Date(examGroup.start_time).toLocaleDateString() : "-"}
                        </Typography>

                        <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
                            Thời gian chờ giữa các đề bài: {(examGroup.await_time ?? 0) / 60} phút
                        </Typography>
                    </Box>
                </Grid>

                {isTeacher && (
                    <Grid
                        size={{ xs: 12, md: 4 }}
                        display="flex"
                        justifyContent={{ xs: "flex-start", md: "flex-end" }}
                        gap={1}
                        alignItems="center"
                    >
                        <Button
                            size={"small"}
                            variant="contained"
                            color="success"
                            onClick={onEdit}
                            sx={{ minWidth: 110, bgcolor: "#38a169" }}
                        >
                            Chỉnh sửa
                        </Button>

                        <Button size={"small"} variant="outlined" color="error" onClick={onDelete} sx={{ minWidth: 110 }}>
                            Xóa bỏ
                        </Button>
                    </Grid>
                )}
            </Grid>
        </Paper>
    );
};

export default ExamHeader;
