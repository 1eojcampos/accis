"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import * as RechartsPrimitive from "recharts";

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >["children"]
}) {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border flex aspect-video justify-center text-xs [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-hidden",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, config]) => config.theme || config.color
  )

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color
    return color ? `  --color-${key}: ${color};` : null
  })
  .join("\n")}
}
`
          )
          .join("\n"),
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

interface TooltipPayloadItem {
  color?: string;
  name?: string;
  value?: number | string;
  dataKey?: string;
  payload?: {
    fill?: string;
    [key: string]: any;
  };
}

interface ChartTooltipContentProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  className?: string;
  indicator?: "dot" | "line" | "dashed";
  hideLabel?: boolean;
  hideIndicator?: boolean;
  label?: string;
  labelFormatter?: (value: string, payload?: TooltipPayloadItem[]) => string;
  labelClassName?: string;
  formatter?: (value: number | string, name?: string, item?: TooltipPayloadItem, index?: number, payload?: any) => string;
  color?: string;
  nameKey?: string;
  labelKey?: string;
  nestLabel?: boolean;
}

function ChartTooltipContent({
  active,
  payload = [],
  className,
  indicator = "dot",
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey,
  nestLabel = false,
  ...props
}: ChartTooltipContentProps) {
  const tooltipLabel = React.useMemo(() => {
    if (!label) return "";
    return String(label);
  }, [label]);

  if (!active) {
    return null;
  }

  const value = label ?? tooltipLabel;
  const valueStr = typeof value === 'undefined' ? '' : String(value);

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border bg-background px-3 py-2 shadow-md",
        className
      )}
      {...props}
    >
      {!hideLabel && label && labelFormatter ? (
        <div className={cn("font-medium", labelClassName)}>
          {labelFormatter(valueStr, payload)}
        </div>
      ) : (
        !hideLabel && (
          <div className={cn("font-medium", labelClassName)}>{valueStr}</div>
        )
      )}

      <div className="flex flex-col gap-1">
        {payload.map((item, index) => {
          const indicatorColor = color || item.payload?.fill || item.color;
          const name = nameKey && item.payload ? item.payload[nameKey] : item.name;
          const value = labelKey && item.payload ? item.payload[labelKey] : item.value;

          return (
            <div key={`${name}-${index}`} className="flex items-center gap-2">
              {!hideIndicator &&
                (indicator === "dot" ? (
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{
                      background: indicatorColor,
                    }}
                  />
                ) : (
                  <div
                    className={cn(
                      "h-0.5 w-4",
                      indicator === "line" && "rounded-full",
                      indicator === "dashed" && "border-b border-dashed"
                    )}
                    style={{
                      background: indicator === "dashed" ? "none" : indicatorColor,
                      borderColor: indicator === "dashed" ? indicatorColor : "none",
                    }}
                  />
                ))}
              <div
                className={cn(
                  "flex min-w-[100px] flex-col",
                  nestLabel ? "items-end" : "items-center"
                )}
              >
                {nestLabel ? tooltipLabel : null}
                <span className="text-sm text-muted-foreground">
                  {name}
                </span>
              </div>
              <span className="text-sm font-medium text-foreground">
                {formatter && value !== undefined
                  ? formatter(value, name as string, item, index, item.payload)
                  : value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ChartLegendProps extends React.ComponentProps<"div"> {
  payload?: Array<{
    value?: string;
    color?: string;
    dataKey?: string;
  }>;
  verticalAlign?: "top" | "middle" | "bottom";
  hideIcon?: boolean;
  nameKey?: string;
}

export function ChartLegendComponent({
  className,
  payload = [],
  verticalAlign = "bottom",
  nameKey,
  hideIcon,
  ...props
}: ChartLegendProps) {
  const { config } = useChart();

  if (!payload.length) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-4",
        verticalAlign === "top" ? "pb-3" : "pt-3",
        className
      )}
      {...props}
    >
      {payload.map((item) => {
        const key = `${nameKey || item.dataKey || "value"}`;
        const itemConfig = getPayloadConfigFromPayload(config, item, key);

        return (
          <div
            key={item.value}
            className={cn(
              "[&>svg]:text-muted-foreground flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3"
            )}
          >
            {itemConfig?.icon && !hideIcon ? (
              <itemConfig.icon />
            ) : (
              <div
                className="h-2 w-2 shrink-0 rounded-[2px]"
                style={{
                  backgroundColor: item.color,
                }}
              />
            )}
            {item.value}
          </div>
        );
      })}
    </div>
  );
}

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string
) {
  if (typeof payload !== "object" || payload === null) {
    return undefined
  }

  const payloadPayload =
    "payload" in payload &&
    typeof payload.payload === "object" &&
    payload.payload !== null
      ? payload.payload
      : undefined

  let configLabelKey: string = key

  if (
    key in payload &&
    typeof payload[key as keyof typeof payload] === "string"
  ) {
    configLabelKey = payload[key as keyof typeof payload] as string
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
  ) {
    configLabelKey = payloadPayload[
      key as keyof typeof payloadPayload
    ] as string
  }

  return configLabelKey in config
    ? config[configLabelKey]
    : config[key as keyof typeof config]
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegendComponent as ChartLegend,
  ChartStyle,
}
