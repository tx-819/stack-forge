import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { setAccessToken } from "@/store/userStore";
import { Spin } from "antd";


const LoginSuccess = () => {
    const [searchParams] = useSearchParams();
    const accessToken = searchParams.get("accessToken");

    useEffect(() => {
        if (accessToken) {
            setAccessToken(accessToken);
            location.href = "/";
        }
    }, [accessToken]);

    return (
        <div>
            <Spin size="large" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
    );
};

export default LoginSuccess;