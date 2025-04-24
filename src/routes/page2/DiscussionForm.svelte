<script lang="ts">
	export let currentUser: string;
	export let onSubmit: (data: { title: string; content: string }) => void;
	export let onClose: () => void;

	let title = '';
	let content = '';

	function handleSubmit() {
		if (title.trim() && content.trim()) {
			onSubmit({ title, content });
			title = '';
			content = '';
		}
	}
</script>

<div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
	<div class="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-2xl border border-gray-100 w-full max-w-2xl transform transition-all duration-300 hover:shadow-3xl">
		<div class="flex justify-between items-center mb-6">
			<h2 class="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">New Discussion</h2>
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
				<label for="title" class="block text-sm font-medium text-gray-700 mb-1">Title</label>
				<input
					type="text"
					id="title"
					bind:value={title}
					class="w-full px-4 py-2 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 bg-white/50"
					placeholder="Enter discussion title..."
				/>
			</div>

			<div>
				<label for="content" class="block text-sm font-medium text-gray-700 mb-1">Content</label>
				<textarea
					id="content"
					bind:value={content}
					rows="4"
					class="w-full px-4 py-2 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 bg-white/50"
					placeholder="Write your discussion content..."
				></textarea>
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
					disabled={!title.trim() || !content.trim()}
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					<span>Create Discussion</span>
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