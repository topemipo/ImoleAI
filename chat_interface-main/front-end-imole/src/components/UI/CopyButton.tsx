"use client";

import { useState } from "react";
import { BsCopy } from "react-icons/bs";
import { IoCheckmarkOutline } from "react-icons/io5";
import { Button } from "./Button";

interface CopyButtonProps {
 readonly message: string;
}

export default function CopyButton({ message }: CopyButtonProps) {
	const [onCopy, setOnCopy] = useState(false);
	const [onSuccess, setOnSuccess] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(message);
			setOnCopy(true);
		} catch (err) {
			console.error("Failed to copy: ", err);
		}
	};
	return (
		<Button
            type="button"
            title="Copy"
			variant="ghost"
          	size="sm"
			className="hover:scale-105 relative p-2 rounded-md cursor-pointer"
			onClick={handleCopy}
		>
			<IoCheckmarkOutline
				className={`" cursor-pointer transition-all w-5 h-5 text-green-500 ${
					onSuccess ? "scale-100 " : "scale-0 "
				}`}
				onTransitionEnd={() => {
					setTimeout(() => {
						setOnSuccess(false);
						setOnCopy(false);
					}, 500);
				}}
			/>
			<div className="h-full w-full absolute top-0 left-0 pl-2 flex items-center">
				<BsCopy
					className={`transition-all ${
						onCopy ? "scale-0" : "scale-100"
					}`}
					onTransitionEnd={() => {
						if (onCopy) {
							setOnSuccess(true);
						}
					}}
				/>
			</div>
			<p>{onSuccess ? 'Copied':'Copy'}</p>
		</Button>
	);
}