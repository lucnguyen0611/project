import React, { useState, useEffect, useCallback } from "react";
import {Box, Alert, CircularProgress} from "@mui/material";
import { classApi } from "@/api/class.api";
import {useAuth, useToast} from "@/contexts";
import type { Class } from "@/types/class.types";
import { Header } from "@/components/common/Header";
import {
    ClassListHeader,
    ClassListGrid,
} from "@/components/class";
import { debounce } from "@/utils/encoding.utils";

const ClassListPage: React.FC = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    // const navigate = useNavigate();
    const [classes, setClasses] = useState<Class[]>([]);
    const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchLoading, setSearchLoading] = useState(false);

    const isTeacher = user?.role === "teacher" || user?.role === "admin";

    useEffect(() => {
        loadClasses();
    }, []);

    console.log(user)

    // Debounced search function
    const debouncedSearch = useCallback(
        debounce((searchValue: string) => {
            setSearchLoading(true);

            // Immediate search for better responsiveness
            if (!searchValue.trim()) {
                setFilteredClasses(classes);
            } else {
                const filtered = classes.filter(
                    (cls) =>
                        cls.name
                            .toLowerCase()
                            .includes(searchValue.toLowerCase()) ||
                        cls.code
                            .toLowerCase()
                            .includes(searchValue.toLowerCase())
                );
                setFilteredClasses(filtered);
            }
            setSearchLoading(false);
        }, 300), // 300ms debounce delay
        [classes]
    );

    // Effect to trigger debounced search when searchTerm changes
    useEffect(() => {
        debouncedSearch(searchTerm);
    }, [searchTerm, debouncedSearch]);

    const loadClasses = async () => {
        try {
            setLoading(true);
            setError(null);
            const classList = await classApi.getClasses();
            setClasses(classList);

            // Apply current search filter to new data
            if (searchTerm.trim()) {
                const filtered = classList.filter(
                    (cls) =>
                        cls.name
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase()) ||
                        cls.code
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase())
                );
                setFilteredClasses(filtered);
            } else {
                setFilteredClasses(classList);
            }
        } catch (err: any) {
            setError("Không thể tải danh sách lớp học");
            console.error("Error loading classes:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);

        // Clear search immediately if empty for better UX
        if (!value.trim()) {
            setFilteredClasses(classes);
            setSearchLoading(false);
        }
    };


    const baseUrl: string = window.location.origin;

// nhận classId (số) và copy link tương ứng
    const handleShare = (classId: number) => {
        const linkToInvite = `${baseUrl}/invite/${classId}`;
        navigator.clipboard.writeText(linkToInvite)
            .then(() => {
                showToast("Đã sao chép link lớp học!");
            })
            .catch((err) => {
                showToast("Sao chép thất bại !");
                console.error("Failed to copy link to clipboard: ", err);
            });
    };

    const handleEnterClass = (classId: number) => {
        console.log("Entering class:", classId);
    };

    if (loading) {
        return (
            <Box>
                <Header/>
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "50vh",
                    }}
                >
                    <CircularProgress />
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{ mt: 8 }}>
            <Header />
            <Box sx={{ p: 3 }}>
                <ClassListHeader
                    searchTerm={searchTerm}
                    onSearchChange={handleSearchChange}
                    isTeacher={isTeacher}
                    searchLoading={searchLoading}
                />

                {/* Error Alert */}
                {error && (
                    <Alert
                        severity="error"
                        sx={{ mb: 3 }}
                        onClose={() => setError(null)}
                    >
                        {error}
                    </Alert>
                )}

                {/* Class List Grid */}
                <ClassListGrid
                    classes={filteredClasses}
                    searchTerm={searchTerm}
                    onShare={handleShare}
                    onEnterClass={handleEnterClass}
                />
            </Box>
        </Box>
    );
};

export default ClassListPage;