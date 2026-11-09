
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";

import { prisma } from "@/src/lib/prisma";
import { getCurrentUser } from "@/src/lib/auth";
import { getAccessiblePondIds } from "@/lib/pond-access";
import { ActivityForm } from "@/components/operations/activity-form";
type TelemetryStatus =
    | "NO_DATA"
    | "NO_THRESHOLD"
    | "WARNING"
    | "NORMAL";
async function OperationsContent() {
    await connection();

    const user = await getCurrentUser();

    if (!user) redirect("/login");

    if (
        user.role !== "MANAGER" &&
        user.role !== "OPERATOR"
    ) {
        redirect("/users");
    }

    const accessibleIds = await getAccessiblePondIds(user);

    const records = await prisma.pond.findMany({
        where: {
            id: { in: accessibleIds },
            isActive: true,
        },
        orderBy: { name: "asc" },
        include: {
            thresholds: {
                where: { isEnabled: true },
            },
            members: {
                where: {
                    user: {
                        role: "OPERATOR",
                        isActive: true,
                    },
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            },
        },
    });

    const parameters = [
        "PH",
        "TEMPERATURE",
        "TDS",
    ] as const;

    const ponds = await Promise.all(
        records.map(async (pond) => {
            const readings = await Promise.all(
                parameters.map((parameter) =>
                    prisma.waterReading.findFirst({
                        where: {
                            pondId: pond.id,
                            parameter,
                        },
                        orderBy: {
                            observedAt: "desc",
                        },
                        select: {
                            value: true,
                            unit: true,
                            observedAt: true,
                        },
                    })
                )
            );


            const telemetry = parameters.map((parameter, index) => {
                const reading = readings[index];

                const threshold = pond.thresholds.find(
                    (item) => item.parameter === parameter
                );

                const value = reading
                    ? Number(reading.value)
                    : null;

                const outOfRange =
                    value !== null &&
                    threshold !== undefined &&
                    (
                        (threshold.minValue !== null &&
                            value < Number(threshold.minValue)) ||
                        (threshold.maxValue !== null &&
                            value > Number(threshold.maxValue))
                    );

                const status:
                    | "NO_DATA"
                    | "NO_THRESHOLD"
                    | "WARNING"
                    | "NORMAL" =
                    value === null
                        ? "NO_DATA"
                        : !threshold
                            ? "NO_THRESHOLD"
                            : outOfRange
                                ? "WARNING"
                                : "NORMAL";

                return {
                    parameter,
                    value,
                    unit:
                        reading?.unit ??
                        (parameter === "TEMPERATURE"
                            ? "°C"
                            : parameter === "TDS"
                                ? "mg/L"
                                : ""),
                    observedAt:
                        reading?.observedAt.toISOString() ?? null,
                    status,
                };
            });


            return {
                id: pond.id,
                name: pond.name,
                code: pond.code,
                telemetry,
                operators: pond.members.map(
                    (member) => member.user
                ),
            };
        })
    );

    const formatter = new Intl.DateTimeFormat(
        "en-GB",
        {
            timeZone: "Asia/Jakarta",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hourCycle: "h23",
        }
    );

    const parts = Object.fromEntries(
        formatter
            .formatToParts(new Date())
            .map((part) => [part.type, part.value])
    );

    const initialDate =
        `${parts.year}-${parts.month}-${parts.day}`;

    const initialTime =
        `${parts.hour}:${parts.minute}`;

    return (
        <ActivityForm
            ponds={ponds}
            role={user.role}
            currentUserId={user.id}
            initialDate={initialDate}
            initialTime={initialTime}
        />
    );
}

export default function OperationsPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-[60vh] items-center justify-center">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
                </div>
            }
        >
            <OperationsContent />
        </Suspense>
    );
}
