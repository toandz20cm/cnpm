declare global {
	namespace App {
		interface Locals {}
		interface PageData {}
		interface Error {}
		interface Platform {}
	}

	interface Discussion {
		id: number;
		title: string;
		content: string;
		author: string;
		time: string;
		comments: {
			id: number;
			content: string;
			author: string;
			time: string;
		}[];
	}
}

export {};