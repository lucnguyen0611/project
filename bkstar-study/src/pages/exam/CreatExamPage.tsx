import {
    Grid,
    Typography,
    TextField,
    Button,
    MenuItem,
    RadioGroup,
    Radio,
    FormControlLabel,
    Paper,
    Box,
    Checkbox,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { examApi } from "@/api/exam.api";
import type { ExamItem } from "@/types";

interface Props {
    mode: "create" | "edit";
}

export default function CreatExamPage({ mode }: Props) {
    const { examGroupId, examDetailId } = useParams();
    const navigate = useNavigate();

    const groupId = Number(examGroupId);
    const examId = Number(examDetailId);

    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [totalTime, setTotalTime] = useState(0);
    const [description, setDescription] = useState("");
    const [questionCount, setQuestionCount] = useState(1);
    const [questionTypes, setQuestionTypes] = useState<{ [key: number]: string }>({});
    const [singleAnswers, setSingleAnswers] = useState<{ [key: number]: string }>({});
    const [multiAnswers, setMultiAnswers] = useState<{ [key: number]: string[] }>({});
    const [fillAnswers, setFillAnswers] = useState<{ [key: number]: string }>({});
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [fileId, setFileId] = useState<number | null>(null);
    const [filePayload, setFilePayload] = useState<string>("");
    const [originalQuestions, setOriginalQuestions] = useState<any[]>([]);

    const toBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve((reader.result as string).split(",")[1]);
            reader.onerror = reject;
        });

    useEffect(() => {
        if (mode !== "edit" || !examId) return;
        const fetchExamDetail = async () => {
            try {
                const data: ExamItem = await examApi.getExamById(examId);
                setName(data.name);
                setCode(data.code);
                setTotalTime(Math.round(data.total_time / 60));
                setDescription(data.description);
                setQuestionCount(data.number_of_question);
                setFileUrl(data.file?.url ?? null);
                setFileId(data.file?.id ?? null);
                setOriginalQuestions(data.questions ?? []);

                const qt: any = {};
                const s: any = {};
                const m: any = {};
                const f: any = {};
                (data.questions ?? []).forEach((q, i) => {
                    const idx = i + 1;
                    if (q.type === "single-choice") qt[idx] = "single";
                    else if (q.type === "multiple-choice") qt[idx] = "multi";
                    else qt[idx] = "fill";
                    if (qt[idx] === "single") s[idx] = q.correct_answer;
                    if (qt[idx] === "multi") m[idx] = q.correct_answer?.split(",") || [];
                    if (qt[idx] === "fill") f[idx] = q.correct_answer;
                });
                setQuestionTypes(qt);
                setSingleAnswers(s);
                setMultiAnswers(m);
                setFillAnswers(f);

                console.log('data sua exam', data)
            } catch (err) {
                console.error(err);
            }
        };
        fetchExamDetail();
    }, [mode, examId]);

    // inside ExamForm component (TypeScript + React)
    const handleSubmit = async () => {
        // simple validation
        if (!name.trim()) {
            alert("Vui lòng nhập tên đề");
            return;
        }
        if (!questionCount || questionCount < 1) {
            alert("Số câu phải >= 1");
            return;
        }

        // build questions array matching backend shape
        const questions = Array.from({ length: questionCount }, (_, i) => {
            const idx = i + 1; // 1-based index used in your UI state
            const uiType = questionTypes[idx] || "single"; // 'single' | 'multi' | 'fill'
            const type =
                uiType === "single"
                    ? "single-choice"
                    : uiType === "multi"
                        ? "multiple-choice"
                        : "long-response";

            let correct_answer = "";
            if (uiType === "single") correct_answer = singleAnswers[idx] ?? "";
            else if (uiType === "multi") correct_answer = (multiAnswers[idx] ?? []).join(",");
            else correct_answer = fillAnswers[idx] ?? "";

            // keep id if editing existing question (so backend can update)
            const existing = originalQuestions?.[i]; // originalQuestions from useEffect when loading edit data
            if (existing && typeof existing.id !== "undefined") {
                return {
                    id: existing.id,
                    index: i,
                    type,
                    correct_answer,
                };
            }

            // new question (no id)
            return {
                index: i,
                type,
                correct_answer,
            };
        });

        // prepare file object
        const filePayloadObj = {
            id: fileId ?? 0, // if editing keep existing id or 0 for new
            url: fileUrl ?? "",
            payload: filePayload ?? "", // if we uploaded image, we'll fill payload below
        };

        // if user selected a new image file, convert to base64 payload
        if (imageFile) {
            try {
                const base64 = await toBase64(imageFile); // returns base64 without data:... prefix
                filePayloadObj.payload = base64;
                // if you need to set url to something placeholder, you can leave it empty; backend should handle
            } catch (err) {
                console.error("Error converting file to base64", err);
                alert("Lỗi khi đọc file ảnh");
                return;
            }
        }

        // final payload shaped like your example
        const payload: ExamItem = {
            id: mode === "edit" ? examId : 0,
            name: name,
            code: String(code ?? ""), // keep as string if API expects string
            exam_group: Number(groupId), // ensure numeric
            number_of_question: Number(questionCount),
            total_time: Number(totalTime) * 60, // convert minutes -> seconds
            correct_answer: {}, // your backend expects object
            questions: questions,
            description: description ?? "",
            file: filePayloadObj,
        };
        try {
            if (mode === "edit" && examId) {
                await examApi.updateExam(examId, payload);
                alert("Cập nhật đề thành công!");
            } else {
                await examApi.createExam(payload);
                alert("Tạo đề thành công!");
            }
            navigate(-1);
        } catch (err) {
            console.error("Gửi payload lỗi:", err);
            // if backend returns useful message show it
            const msg = (err as any)?.response?.data?.message || (err as any)?.message || "Lỗi khi gửi dữ liệu";
            alert(msg);
        }
    };


    return (
        <Box p={2}>
            {/* upload area */}
            <Paper
                sx={{
                    p: 3,
                    mb: 3,
                    borderRadius: 2,
                    minHeight: 220,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "#fafcff",
                    border: "1px dashed rgba(38,198,218,0.6)",
                }}
            >
                <input
                    type="file"
                    hidden
                    id="upload-image"
                    accept="image/*"
                    onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setImageFile(f);
                    }}
                />

                {!imageFile && !fileUrl ? (
                    <label htmlFor="upload-image" style={{ width: "100%", textAlign: "center" }}>
                        <Button
                            variant="outlined"
                            component="span"
                            sx={{
                                textTransform: "none",
                                borderColor: "rgba(0,188,212,0.9)",
                                color: "text.secondary",
                                bgcolor: "transparent",
                                "&:hover": { bgcolor: "rgba(3,169,244,0.06)" },
                            }}
                        >
                            <Box display="flex" alignItems="center" gap={1}>
                                <Box component="span" sx={{ fontSize: 18 }}>⬆</Box>
                                <Box component="span">Tải lên từ máy</Box>
                            </Box>
                        </Button>
                    </label>
                ) : (
                    <Box
                        mt={2}
                        sx={{
                            display: "flex",
                            gap: 2,
                            alignItems: "flex-start",
                            width: "100%",
                            justifyContent: "center",
                            flexDirection: { xs: "column", md: "row" },
                        }}
                    >
                        <Box sx={{ textAlign: "center" }}>
                            <Button
                                variant="text"
                                color="error"
                                onClick={() => {
                                    setImageFile(null);
                                    setFileUrl(null);
                                    setFileId(null);
                                    setFilePayload("");
                                }}
                            >
                                Xóa ảnh
                            </Button>
                            <Box
                                component="img"
                                src={imageFile ? URL.createObjectURL(imageFile) : fileUrl || ""}
                                alt="Preview"
                                sx={{
                                    maxHeight: 260,
                                    maxWidth: { xs: "100%", md: 420 },
                                    borderRadius: 2,
                                    boxShadow: 1,
                                    display: "block",
                                    mt: 1,
                                }}
                            />
                        </Box>
                    </Box>
                )}
            </Paper>

            {/* form */}
            <Paper sx={{ p: 3, borderRadius: 2, bgcolor: "#fff", boxShadow: "none", border: "1px solid #f0f2f5" }}>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            label="Tên đề"
                            fullWidth
                            size="small"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            // variant="outlined"
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: 1.25,
                                    "& fieldset": { borderColor: "rgba(38,198,218,0.35)" },
                                    "&:hover fieldset": { borderColor: "#00bcd4" },
                                    "&.Mui-focused fieldset": { borderColor: "#00bcd4", borderWidth: 1.5 },
                                },
                            }}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            label="Mã đề"
                            fullWidth
                            size="small"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            variant="outlined"
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: 1.25,
                                    "& fieldset": { borderColor: "rgba(38,198,218,0.35)" },
                                    "&:hover fieldset": { borderColor: "#00bcd4" },
                                    "&.Mui-focused fieldset": { borderColor: "#00bcd4", borderWidth: 1.5 },
                                },
                            }}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            label="Thời gian làm bài (phút)"
                            type="number"
                            fullWidth
                            size="small"
                            value={totalTime}
                            onChange={(e) => setTotalTime(Number(e.target.value))}
                            variant="outlined"
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: 1.25,
                                    "& fieldset": { borderColor: "rgba(38,198,218,0.35)" },
                                    "&:hover fieldset": { borderColor: "#00bcd4" },
                                    "&.Mui-focused fieldset": { borderColor: "#00bcd4", borderWidth: 1.5 },
                                },
                            }}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            label="Số câu hỏi"
                            type="number"
                            fullWidth
                            size="small"
                            value={questionCount}
                            onChange={(e) => {
                                const c = Math.max(1, Number(e.target.value || 1));
                                setQuestionCount(c);
                                setQuestionTypes((prev) => {
                                    const copy = { ...prev };
                                    for (let i = 1; i <= c; i++) if (!copy[i]) copy[i] = "single";
                                    return copy;
                                });
                            }}
                            variant="outlined"
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: 1.25,
                                    "& fieldset": { borderColor: "rgba(38,198,218,0.35)" },
                                    "&:hover fieldset": { borderColor: "#00bcd4" },
                                    "&.Mui-focused fieldset": { borderColor: "#00bcd4", borderWidth: 1.5 },
                                },
                            }}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <TextField
                            label="Mô tả"
                            fullWidth
                            multiline
                            rows={2}
                            size="small"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            variant="outlined"
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: 1.25,
                                    "& fieldset": { borderColor: "rgba(38,198,218,0.15)" },
                                    "&:hover fieldset": { borderColor: "#00bcd4" },
                                },
                            }}
                        />
                    </Grid>

                    {/* câu hỏi */}
                    {Array.from({ length: questionCount }, (_, i) => (
                        <Grid size={{ xs: 12 }} key={i}>
                            <Typography fontWeight="bold" mt={2}>
                                Câu {i + 1}
                            </Typography>

                            <TextField
                                select
                                size="small"
                                fullWidth
                                value={questionTypes[i + 1] || "single"}
                                onChange={(e) => setQuestionTypes((prev) => ({ ...prev, [i + 1]: e.target.value }))}
                                sx={{
                                    mb: 1,
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 1.25,
                                        "& fieldset": { borderColor: "rgba(38,198,218,0.35)" },
                                        "&:hover fieldset": { borderColor: "#00bcd4" },
                                        "&.Mui-focused fieldset": { borderColor: "#00bcd4", borderWidth: 1.5 },
                                    },
                                }}
                            >
                                <MenuItem value="single">Chọn 1 đáp án</MenuItem>
                                <MenuItem value="multi">Chọn nhiều đáp án</MenuItem>
                                <MenuItem value="fill">Điền vào chỗ trống</MenuItem>
                            </TextField>

                            {questionTypes[i + 1] === "single" && (
                                <RadioGroup
                                    row
                                    value={singleAnswers[i + 1] || ""}
                                    onChange={(e) => setSingleAnswers((prev) => ({ ...prev, [i + 1]: e.target.value }))}
                                >
                                    {["A", "B", "C", "D"].map((opt) => (
                                        <FormControlLabel key={opt} value={opt} control={<Radio />} label={opt} />
                                    ))}
                                </RadioGroup>
                            )}

                            {questionTypes[i + 1] === "multi" && (
                                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                                    {["A", "B", "C", "D"].map((opt) => (
                                        <FormControlLabel
                                            key={opt}
                                            control={
                                                <Checkbox
                                                    checked={multiAnswers[i + 1]?.includes(opt) || false}
                                                    onChange={(e) => {
                                                        const checked = e.target.checked;
                                                        setMultiAnswers((prev) => {
                                                            const cur = prev[i + 1] || [];
                                                            return {
                                                                ...prev,
                                                                [i + 1]: checked ? [...cur, opt] : cur.filter((a) => a !== opt),
                                                            };
                                                        });
                                                    }}
                                                />
                                            }
                                            label={opt}
                                        />
                                    ))}
                                </Box>
                            )}

                            {questionTypes[i + 1] === "fill" && (
                                <TextField
                                    fullWidth
                                    size="small"
                                    disabled // Disable luôn input vì không cần nhập
                                    placeholder="Học sinh tự điền"
                                    sx={{
                                        mt: 1,
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: 1.25,
                                            "& fieldset": { borderColor: "rgba(38,198,218,0.35)" },
                                        },
                                    }}
                                />
                            )}
                        </Grid>
                    ))}

                    <Grid size={{ xs: 12 }}>
                        <Button variant="contained" color="primary" fullWidth onClick={handleSubmit} sx={{ mt: 1.5 }}>
                            {mode === "edit" ? "Cập nhật đề thi" : "Tạo đề thi"}
                        </Button>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
}
