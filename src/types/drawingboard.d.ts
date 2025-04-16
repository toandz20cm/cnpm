declare global {
	interface Window {
		DrawingBoard: {
			Board: new (
				containerId: string,
				options: {
					size: number;
					controls: (string | { [key: string]: any })[];
					webStorage: boolean;
					enlargeYourContainer: boolean;
				}
			) => {
				canvas: HTMLCanvasElement;
				reset: (options: { webStorage: boolean }) => void;
			};
		};
	}
}

export {}; 