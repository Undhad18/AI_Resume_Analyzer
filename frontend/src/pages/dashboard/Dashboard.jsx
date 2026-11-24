import {
    FileText,
    TrendingUp,
    Award,
    Upload
} from "lucide-react";
import { useEffect, useState } from "react";
import { checkServerHealth } from "../../services/healthService";

const Dashboard = () => {
    const [serverStatus, setServerStatus] = useState("Checking...");

    useEffect(() => {
        const checkConnection = async () => {
            try {
                const response = await checkServerHealth();

                setServerStatus(
                    response.success
                        ? "Backend Connected"
                        : "Connection Failed"
                );
            } catch (error) {
                setServerStatus("Backend Disconnected");
                console.error(error);
            }
        };

        checkConnection();
    }, []);

    const statistics = [
        {
            title: "Total Resumes",
            value: "0",
            icon: FileText
        },
        {
            title: "Average Score",
            value: "0/100",
            icon: TrendingUp
        },
        {
            title: "Best Score",
            value: "0/100",
            icon: Award
        }
    ];

    return (
        <div className="space-y-8">

            <div>
                <h1 className="text-2xl font-bold">
                    Dashboard
                </h1>

                <p className="text-slate-500 mt-1">
                    Manage and improve your resumes with AI.
                </p>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

                {statistics.map((item) => {
                    const Icon = item.icon;

                    return (
                        <div
                            key={item.title}
                            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
                        >
                            <div className="flex justify-between items-center">

                                <div>
                                    <p className="text-slate-500 text-sm">
                                        {item.title}
                                    </p>

                                    <h2 className="text-2xl font-bold mt-2">
                                        {item.value}
                                    </h2>
                                </div>

                                <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
                                    <Icon size={24} />
                                </div>

                            </div>
                        </div>
                    );
                })}

            </div>

            <div className="bg-white border rounded-xl p-5">

                <h2 className="font-semibold">
                    System Connection Status
                </h2>

                <p className="text-green-600 mt-2">
                    {serverStatus}
                </p>

            </div>

            {/* Upload Section */}
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">

                <div className="flex justify-center mb-4">
                    <div className="bg-blue-50 p-4 rounded-full">
                        <Upload size={32} className="text-blue-600" />
                    </div>
                </div>

                <h2 className="text-xl font-bold">
                    Analyze Your Resume
                </h2>

                <p className="text-slate-500 mt-2">
                    Upload your resume and get AI-powered feedback.
                </p>

                <p className="text-sm text-slate-400 mt-2">
                    PDF, DOC, DOCX supported
                </p>

                <button
                    disabled
                    className="mt-5 bg-blue-600 text-white px-6 py-3 rounded-lg opacity-60 cursor-not-allowed"
                >
                    Resume Upload Coming Soon
                </button>

            </div>

        </div>
    );
};

export default Dashboard;