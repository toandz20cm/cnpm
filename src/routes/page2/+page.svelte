<!-- src/routes/page2/+page.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import PostForm from './PostForm.svelte';
    import DiscussionForm from './DiscussionForm.svelte'; // Thêm import mới

    // Interface cho Post
    interface Post {
        id: number;
        comment: string;
        originalFile: string;
        aiFile: string;
        author: string;
        time: string;
    }

    // Interface mới cho Discussion
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

    let currentUser = 'Khách';
    let posts: Post[] = [];
    let discussions: Discussion[] = []; // Thêm state cho discussions
    let showPostForm = false;
    let showDiscussionForm = false; // Thêm state cho form discussion
    let selectedTab = 'all';
    let activeDiscussion: Discussion | null = null; // Thêm state cho discussion đang xem

    onMount(async () => {
        if (typeof window !== 'undefined') {
            currentUser = localStorage.getItem('currentUser') ?? 'Khách';
            await loadPosts();
            await loadDiscussions(); // Tải discussions khi mount
        }
    });

    async function loadPosts() {
        try {
            const response = await fetch('/api/posts');
            if (!response.ok) throw new Error('Lỗi tải bài viết');
            posts = await response.json();
        } catch (error) {
            console.error('Lỗi khi tải bài viết:', error);
        }
    }

    // Thêm hàm tải discussions
    async function loadDiscussions() {
        try {
            const response = await fetch('/api/discussions');
            if (!response.ok) throw new Error('Lỗi tải thảo luận');
            discussions = await response.json();
        } catch (error) {
            console.error('Lỗi khi tải thảo luận:', error);
        }
    }

    async function handlePostSubmit(data: {
        comment: string;
        originalFile: File | null;
        aiFile: File | null;
    }) {
        try {
            if (!data.originalFile || !data.aiFile) {
                throw new Error('Vui lòng chọn cả 2 ảnh');
            }

            const formData = new FormData();
            formData.append('comment', data.comment);
            formData.append('author', currentUser);
            formData.append('originalFile', data.originalFile);
            formData.append('aiFile', data.aiFile);

            const response = await fetch('/api/posts', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Lỗi khi lưu bài viết');

            const newPost = await response.json();
            posts = [newPost, ...posts];
            showPostForm = false;
        } catch (error) {
            console.error('Lỗi khi gửi bài viết:', error);
            alert(error instanceof Error ? error.message : 'Có lỗi xảy ra');
        }
    }

    // Thêm hàm xử lý tạo discussion mới
        async function handleDiscussionSubmit(data: { title: string; content: string }) {
            try {
                const response = await fetch('/api/discussions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        title: data.title,
                        content: data.content,
                        author: currentUser
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to create discussion');
                }

                const newDiscussion = await response.json();
                discussions = [newDiscussion, ...discussions];
                showDiscussionForm = false;
            } catch (error) {
                console.error('Error creating discussion:', error);
                alert(error instanceof Error ? error.message : 'Failed to create discussion');
            }
        }

    // Thêm hàm xử lý bình luận trong discussion
    async function handleAddComment(content: string) {
        if (!activeDiscussion) return;

        try {
            const response = await fetch(`/api/discussions/${activeDiscussion.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    author: currentUser
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Lỗi khi thêm bình luận');
            }

            const updatedDiscussion = await response.json();
            activeDiscussion = updatedDiscussion;

            // Cập nhật danh sách discussions
            discussions = discussions.map(d =>
                d.id === updatedDiscussion.id ? updatedDiscussion : d
            );

            // Hiển thị thông báo thành công
            const successMessage = document.createElement('div');
            successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg';
            successMessage.textContent = 'Bình luận đã được thêm thành công!';
            document.body.appendChild(successMessage);
            setTimeout(() => successMessage.remove(), 3000);
        } catch (error) {
            console.error('Lỗi khi thêm bình luận:', error);
            // Hiển thị thông báo lỗi
            const errorMessage = document.createElement('div');
            errorMessage.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg';
            errorMessage.textContent = error instanceof Error ? error.message : 'Có lỗi xảy ra khi thêm bình luận';
            document.body.appendChild(errorMessage);
            setTimeout(() => errorMessage.remove(), 3000);
        }
    }

    function submitCommentViaButton() {
        const input = document.getElementById('commentInput') as HTMLTextAreaElement;
        if (input && input.value.trim()) {
            handleAddComment(input.value.trim());
            input.value = '';
        } else {
            // Hiển thị thông báo nếu bình luận trống
            const errorMessage = document.createElement('div');
            errorMessage.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg';
            errorMessage.textContent = 'Vui lòng nhập nội dung bình luận';
            document.body.appendChild(errorMessage);
            setTimeout(() => errorMessage.remove(), 3000);
        }
    }
</script>

<div class="flex min-h-screen p-6 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
    <!-- Sidebar -->
    <div class="w-64 mr-8">
        <button
          class="w-full mb-4 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-purple-700 transform hover:scale-[1.02] transition-all duration-300 flex items-center justify-center space-x-2"
          on:click={() => showDiscussionForm = true}
        >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span>New discussion</span>
        </button>
        <button
          class="w-full mb-6 px-4 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-pink-700 hover:to-rose-700 transform hover:scale-[1.02] transition-all duration-300 flex items-center justify-center space-x-2"
          on:click={() => showPostForm = true}
        >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>New post</span>
        </button>
    </div>

    <!-- Main content -->
    <div class="flex-1">
        <!-- Tabs -->
        <div class="flex items-center mb-6 bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-gray-100">
            <div class="flex space-x-4">
                <button
                  class={`px-4 py-2 rounded-lg transition-all duration-300 ${
                    selectedTab === 'all' 
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                  on:click={() => { selectedTab = 'all'; activeDiscussion = null; }}
                >
                    All
                </button>
                <button
                  class={`px-4 py-2 rounded-lg transition-all duration-300 ${
                    selectedTab === 'discussions' 
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                  on:click={() => { selectedTab = 'discussions'; activeDiscussion = null; }}
                >
                    Discussions
                </button>
            </div>
            <input
              type="text"
              placeholder="Filter by title..."
              class="ml-auto px-4 py-2 border border-gray-200 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
            />
        </div>

        {#if activeDiscussion}
            <!-- Chi tiết discussion -->
            <div class="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-100 mb-4 transform transition-all duration-300 hover:shadow-xl">
                <button
                  on:click={() => activeDiscussion = null}
                  class="mb-4 text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 transition duration-200"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>Back to discussions</span>
                </button>

                <h2 class="text-2xl font-bold mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{activeDiscussion.title}</h2>
                <p class="text-sm text-gray-500 mb-4 flex items-center space-x-2">
                    <span>Posted by <span class="text-indigo-600 font-medium">{activeDiscussion.author}</span></span>
                    <span class="text-gray-300">•</span>
                    <span>{activeDiscussion.time}</span>
                </p>
                <p class="mb-6 text-gray-700 leading-relaxed">{activeDiscussion.content}</p>

                <div class="border-t border-gray-100 pt-4">
                    <h3 class="font-semibold mb-4 text-lg">Comments ({activeDiscussion.comments.length})</h3>

                    <!-- Form thêm bình luận -->
                    <div class="mb-6 bg-gray-50/80 backdrop-blur-sm p-4 rounded-xl border border-gray-100">
                        <textarea
                            id="commentInput"
                            class="w-full p-3 border border-gray-200 rounded-lg mb-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 bg-white/50"
                            placeholder="Write your comment..."
                            rows="3"
                        ></textarea>
                        <div class="flex justify-end">
                            <button
                                on:click={submitCommentViaButton}
                                class="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition duration-300 transform hover:scale-[1.02] flex items-center space-x-2 shadow-lg hover:shadow-xl"
                            >
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                                </svg>
                                <span>Add Comment</span>
                            </button>
                        </div>
                    </div>

                    <!-- Danh sách bình luận -->
                    <div class="space-y-4">
                        {#each activeDiscussion.comments as comment}
                            <div class="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-gray-100 transform transition-all duration-300 hover:shadow-md">
                                <div class="flex items-center justify-between mb-2">
                                    <div class="flex items-center space-x-2">
                                        <span class="font-medium text-indigo-600">{comment.author}</span>
                                        <span class="text-xs text-gray-300">•</span>
                                        <span class="text-xs text-gray-500">{comment.time}</span>
                                    </div>
                                </div>
                                <p class="text-gray-700 leading-relaxed">{comment.content}</p>
                            </div>
                        {/each}
                    </div>
                </div>
            </div>
        {:else}
            <!-- Danh sách posts/discussions -->
            <div class="space-y-4">
                {#if selectedTab === 'all'}
                    <!-- Hiển thị cả posts và discussions -->
                    {#each posts as post (post.id)}
                        <div class="bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-100 transform transition-all duration-300 hover:shadow-xl hover:scale-[1.01]">
                            <div class="text-sm text-gray-500 flex items-center space-x-2">
                                <span class="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs">#{post.id}</span>
                                <span>by <span class="text-indigo-600 font-medium">{post.author}</span></span>
                                <span class="text-gray-300">•</span>
                                <span>{post.time}</span>
                            </div>
                            <p class="mt-2 text-gray-700">{post.comment}</p>
                            <div class="mt-3 flex gap-4">
                                <img src={post.originalFile} alt="Original" class="w-32 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition duration-300" />
                                <img src={post.aiFile} alt="AI Generated" class="w-32 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition duration-300" />
                            </div>
                        </div>
                    {/each}

                    {#each discussions as discussion (discussion.id)}
                        <div
                          class="bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-100 transform transition-all duration-300 hover:shadow-xl hover:scale-[1.01] cursor-pointer"
                          on:click={() => activeDiscussion = discussion}
                        >
                            <div class="text-sm text-gray-500 flex items-center space-x-2">
                                <span class="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs">#{discussion.id}</span>
                                <span>by <span class="text-indigo-600 font-medium">{discussion.author}</span></span>
                                <span class="text-gray-300">•</span>
                                <span>{discussion.time}</span>
                            </div>
                            <h3 class="font-semibold mt-2 text-lg">{discussion.title}</h3>
                            <p class="mt-1 text-gray-600 line-clamp-2">{discussion.content}</p>
                            <div class="mt-3 flex items-center space-x-2 text-sm text-gray-500">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                                <span>{discussion.comments.length} comments</span>
                            </div>
                        </div>
                    {/each}
                {:else}
                    <!-- Chỉ hiển thị discussions -->
                    {#each discussions as discussion (discussion.id)}
                        <div
                          class="bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-100 transform transition-all duration-300 hover:shadow-xl hover:scale-[1.01] cursor-pointer"
                          on:click={() => activeDiscussion = discussion}
                        >
                            <div class="text-sm text-gray-500 flex items-center space-x-2">
                                <span class="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs">#{discussion.id}</span>
                                <span>by <span class="text-indigo-600 font-medium">{discussion.author}</span></span>
                                <span class="text-gray-300">•</span>
                                <span>{discussion.time}</span>
                            </div>
                            <h3 class="font-semibold mt-2 text-lg">{discussion.title}</h3>
                            <p class="mt-1 text-gray-600 line-clamp-2">{discussion.content}</p>
                            <div class="mt-3 flex items-center space-x-2 text-sm text-gray-500">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                                <span>{discussion.comments.length} comments</span>
                            </div>
                        </div>
                    {/each}
                {/if}
            </div>
        {/if}

        <!-- User info -->
        <div class="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A9 9 0 1119.78 4.222 9 9 0 015.12 17.804z" />
            </svg>
            <span>{currentUser}</span>
        </div>
    </div>

    {#if showPostForm}
        <PostForm
          currentUser={currentUser}
          onSubmit={handlePostSubmit}
          onClose={() => showPostForm = false}
        />
    {/if}

    {#if showDiscussionForm}
        <DiscussionForm
          currentUser={currentUser}
          onSubmit={handleDiscussionSubmit}
          onClose={() => showDiscussionForm = false}
        />
    {/if}
</div>

<style>
    /* Thêm các hiệu ứng animation */
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .animate-fade-in {
        animation: fadeIn 0.3s ease-out;
    }

    /* Custom scrollbar */
    ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
    }

    ::-webkit-scrollbar-track {
        background: rgba(241, 241, 241, 0.5);
        border-radius: 4px;
    }

    ::-webkit-scrollbar-thumb {
        background: rgba(99, 102, 241, 0.5);
        border-radius: 4px;
    }

    ::-webkit-scrollbar-thumb:hover {
        background: rgba(99, 102, 241, 0.7);
    }

    /* Text selection */
    ::selection {
        background: rgba(99, 102, 241, 0.2);
    }

    /* Smooth transitions */
    .transition-all {
        transition-property: all;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 300ms;
    }
</style>