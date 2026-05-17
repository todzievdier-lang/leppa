"use client";

import { useEffect, useState } from "react";

type AsyncFunction<T> = () => Promise<T>;

type UseApiReturn<T> = {
	data: T | null;
	loading: boolean;
	error: string | null;
	isFallback: boolean;
};

export function useApi<T>(
	apiFunction: AsyncFunction<T>,
	fallbackData?: T,
): UseApiReturn<T> {
	const [data, setData] = useState<T | null>(null);

	const [loading, setLoading] = useState(true);

	const [error, setError] = useState<string | null>(null);

	const [isFallback, setIsFallback] = useState(false);

	useEffect(() => {
		let isActive = true;

		async function fetchData() {
			try {
				setLoading(true);
				setError(null);
				setIsFallback(false);

				const response = await apiFunction();

				if (!isActive) {
					return;
				}

				setData(response);
			} catch (error) {
				console.error(error);

				if (!isActive) {
					return;
				}

				setError("Something went wrong");

				if (fallbackData !== undefined) {
					setData(fallbackData);
					setIsFallback(true);
				}
			} finally {
				if (isActive) {
					setLoading(false);
				}
			}
		}

		fetchData();

		return () => {
			isActive = false;
		};
	}, [apiFunction, fallbackData]);

	return {
		data,
		loading,
		error,
		isFallback,
	};
}
