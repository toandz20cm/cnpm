<!-- src/routes/page2/PostForm.svelte -->
<script lang="ts">
	import { onDestroy } from 'svelte';
	export let currentUser: string;

	export let onSubmit: (data: {
		comment: string;
		originalFile: File | null;
		aiFile: File | null;
	}) => void;
	export let onClose: () => void;

	let comment = '';
	let originalFile: File | null = null;
	let aiFile: File | null = null;
	let originalPreview = '';
	let aiPreview = '';
	let error = '';

	function handleFileChange(event: Event, type: 'original' | 'ai') {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files[0]) {
			const file = input.files[0];
			if (!file.type.startsWith('image/')) {
				error = 'Chỉ chấp nhận file ảnh';
				return;
			}

			if (type === 'original') {
				originalFile = file;
				originalPreview = URL.createObjectURL(file);
			} else {
				aiFile = file;
				aiPreview = URL.createObjectURL(file);
			}
			error = '';
		}
	}

	function handleSubmit() {
		if (comment.trim() && originalFile && aiFile) {
			onSubmit({ comment, originalFile, aiFile });
			comment = '';
			originalFile = null;
			aiFile = null;
			originalPreview = '';
			aiPreview = '';
		}
	}

	function clearFile(type: 'original' | 'ai') {
		if (type === 'original') {
			originalFile = null;
			originalPreview = '';
		} else {
			aiFile = null;
			aiPreview = '';
		}
	}

	onDestroy(() => {
		if (originalPreview) URL.revokeObjectURL(originalPreview);
		if (aiPreview) URL.revokeObjectURL(aiPreview);
	});
</script>

<div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
	<div class="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-2xl border border-gray-100 w-full max-w-2xl transform transition-all duration-300 hover:shadow-3xl">
		<div class="flex justify-between items-center mb-6">
			<h2 class="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">New Post</h2>
			<button
				on:click={onClose}
				class="text-gray-500 hover:text-gray-700 transition duration-200 p-2 rounded-full hover:bg-gray-100"
			>
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<div class="space-y-4">
			<div>
				<label for="comment" class="block text-sm font-medium text-gray-700 mb-1">Comment</label>
				<textarea
					id="comment"
					bind:value={comment}
					rows="3"
					class="w-full px-4 py-2 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 bg-white/50"
					placeholder="Write your comment..."
				></textarea>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<label class="block text-sm font-medium text-gray-700">Original Image</label>
					<div class="relative">
						<input
							type="file"
							accept="image/*"
							on:change={(e) => handleFileChange(e, 'original')}
							class="hidden"
							id="originalFile"
						/>
						<label
							for="originalFile"
							class="block w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500 transition duration-200 flex items-center justify-center"
						>
							{#if originalPreview}
								<div class="relative w-full h-full">
									<img src={originalPreview} alt="Original preview" class="w-full h-full object-cover rounded-lg" />
									<button
										type="button"
										on:click={() => clearFile('original')}
										class="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition duration-200"
									>
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
										</svg>
									</button>
								</div>
							{:else}
								<div class="text-center">
									<svg class="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
									</svg>
									<span class="mt-2 block text-sm text-gray-500">Click to upload</span>
								</div>
							{/if}
						</label>
					</div>
				</div>

				<div class="space-y-2">
					<label class="block text-sm font-medium text-gray-700">AI Generated Image</label>
					<div class="relative">
						<input
							type="file"
							accept="image/*"
							on:change={(e) => handleFileChange(e, 'ai')}
							class="hidden"
							id="aiFile"
						/>
						<label
							for="aiFile"
							class="block w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500 transition duration-200 flex items-center justify-center"
						>
							{#if aiPreview}
								<div class="relative w-full h-full">
									<img src={aiPreview} alt="AI preview" class="w-full h-full object-cover rounded-lg" />
									<button
										type="button"
										on:click={() => clearFile('ai')}
										class="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition duration-200"
									>
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
										</svg>
									</button>
								</div>
							{:else}
								<div class="text-center">
									<svg class="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
									</svg>
									<span class="mt-2 block text-sm text-gray-500">Click to upload</span>
								</div>
							{/if}
						</label>
					</div>
				</div>
			</div>

			<div class="flex justify-end space-x-3 pt-4">
				<button
					on:click={onClose}
					class="px-4 py-2 text-gray-600 hover:text-gray-800 transition duration-200 rounded-lg hover:bg-gray-100"
				>
					Cancel
				</button>
				<button
					on:click={handleSubmit}
					class="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition duration-300 transform hover:scale-[1.02] flex items-center space-x-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
					disabled={!comment.trim() || !originalFile || !aiFile}
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					<span>Create Post</span>
				</button>
			</div>
		</div>
	</div>
</div>

<style>
	.animate-fade-in {
		animation: fadeIn 0.3s ease-out;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}
</style>