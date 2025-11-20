// Mock Recharts components to avoid canvas rendering issues in jsdom
export const ResponsiveContainer = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
export const BarChart = ({ children }: { children?: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>;
export const Bar = () => <div data-testid="bar" />;
export const XAxis = () => <div data-testid="x-axis" />;
export const YAxis = () => <div data-testid="y-axis" />;
export const CartesianGrid = () => <div data-testid="cartesian-grid" />;
export const Tooltip = () => <div data-testid="tooltip" />;
export const Legend = () => <div data-testid="legend" />;
export const Cell = () => <div data-testid="cell" />;
