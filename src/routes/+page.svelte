<script lang="ts">
	import { onMount, tick } from 'svelte';
	import ShareWithCommunity from "$lib/ShareWithCommunity.svelte";
	import { slide } from 'svelte/transition';
	import { fade } from 'svelte/transition';
	import { scale } from 'svelte/transition';
	import { fly } from 'svelte/transition';
	import { blur } from 'svelte/transition';
	import { crossfade } from 'svelte/transition';
	import { draw } from 'svelte/transition';
	import { createEventDispatcher } from 'svelte';

	// Authentication state
	let isAuthenticated = false;
	let isLoginView = true;
	let username = '';
	let password = '';
	let confirmPassword = '';
	let loginError = '';
	let signupError = '';
	let isMainPage = false;
	let isPremium = false;
	let isAdmin = false;
	let showPremiumModal = false;
	let showUserMenu = false;
	let showSecurityModal = false;
	let showAdminLoginModal = false;
	let showAdminPanel = false;
	let showNotificationHistory = false;
	let showPersonalInfoModal = false;
	let currentPassword = '';
	let newPassword = '';
	let confirmNewPassword = '';
	let securityError = '';
	let adminError = '';
	let personalInfoError = '';
	let users: { username: string; premium: boolean; isAdmin: boolean }[] = [];
	let adminUsername = '';
	let adminPassword = '';
	let notifications: { id: number; message: string; timestamp: string }[] = [];
	let currentNotification: { id: number; message: string; timestamp: string } | null = null;
	let showNotification = false;
	let newNotificationMessage = '';
	let personalInfo = {
		birthDate: '',
		phoneNumber: '',
		address: '',
		company: ''
	};

	async function loadPersonalInfo() {
		try {
			const response = await fetch('/api/userInfo', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					action: 'getUserInfo',
					username
				})
			});

			const data = await response.json();
			if (data.success && data.userInfo) {
				personalInfo = {
					birthDate: data.userInfo.birthDate || '',
					phoneNumber: data.userInfo.phoneNumber || '',
					address: data.userInfo.address || '',
					company: data.userInfo.company || ''
				};
			}
		} catch (error) {
			console.error('Error loading personal info:', error);
		}
	}

	// Handle authentication
	async function handleLogin(event: Event) {
		event.preventDefault();
		try {
			const response = await fetch('/api/auth', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					action: 'login',
					username,
					password
				})
			});

			const data = await response.json();
			if (data.success) {
				isAuthenticated = true;
				isPremium = data.premium;
				isAdmin = data.isAdmin;
				notifications = data.notifications || [];
				if (notifications.length > 0) {
					currentNotification = notifications[notifications.length - 1];
					showNotification = true;
				}
				loginError = '';
				username = '';
				password = '';
				handleEnterMainPage();
			} else {
				loginError = data.error || 'Invalid username or password';
			}
		} catch (error) {
			console.error('Login error:', error);
			loginError = 'Server error';
		}
	}

	async function handleAdminLogin(event: Event) {
		event.preventDefault();
		try {
			const response = await fetch('/api/auth', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					action: 'getUsers',
					username: adminUsername,
					password: adminPassword
				})
			});

			const data = await response.json();
			if (data.success) {
				users = data.users;
				notifications = data.notifications || [];
				if (notifications.length > 0) {
					currentNotification = notifications[notifications.length - 1];
				}
				adminError = '';
				showAdminLoginModal = false;
				showAdminPanel = true;
			} else {
				adminError = data.error || 'Invalid admin credentials';
			}
		} catch (error) {
			console.error('Admin login error:', error);
			adminError = 'Server error';
		}
	}

	async function handleDeleteUser(targetUsername: string) {
		try {
			const response = await fetch('/api/auth', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					action: 'deleteUser',
					username: adminUsername,
					password: adminPassword,
					targetUsername
				})
			});

			const data = await response.json();
			if (data.success) {
				users = users.filter(user => user.username !== targetUsername);
			} else {
				adminError = data.error || 'Failed to delete user';
			}
		} catch (error) {
			console.error('Delete user error:', error);
			adminError = 'Server error';
		}
	}

	async function handleTogglePremium(targetUsername: string) {
		try {
			const response = await fetch('/api/auth', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					action: 'togglePremium',
					username: adminUsername,
					password: adminPassword,
					targetUsername
				})
			});

			const data = await response.json();
			if (data.success) {
				const userIndex = users.findIndex(user => user.username === targetUsername);
				if (userIndex !== -1) {
					users[userIndex].premium = data.premium;
				}
			} else {
				adminError = data.error || 'Failed to toggle premium status';
			}
		} catch (error) {
			console.error('Toggle premium error:', error);
			adminError = 'Server error';
		}
	}

	function handleUpgradePremium() {
		showPremiumModal = true;
	}

	function closePremiumModal() {
		showPremiumModal = false;
	}

	async function confirmUpgrade() {
		try {
			const response = await fetch('/api/auth', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					action: 'upgrade',
					username
				})
			});

			const data = await response.json();
			if (data.success) {
				isPremium = true;
				showPremiumModal = false;
				alert('Upgrade to premium successful!');
			} else {
				alert('Upgrade failed: ' + data.error);
			}
		} catch (error) {
			console.error('Upgrade error:', error);
			alert('Server error');
		}
	}

	function handleStrengthChange(e: Event) {
		const target = e.target as HTMLInputElement;
		if (!isPremium && parseFloat(target.value) > 0.85) {
			target.value = '0.85';
			strength = '0.85';
			alert('Only premium users can set strength above 0.85');
		} else {
			strength = target.value;
		}
	}

	async function handleSignup(event: Event) {
		event.preventDefault();
		if (!username || !password) {
			signupError = 'Please fill in all fields';
			return;
		}
		if (password !== confirmPassword) {
			signupError = 'Passwords do not match';
			return;
		}

		try {
			const response = await fetch('/api/auth', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					action: 'signup',
					username,
					password
				})
			});

			const data = await response.json();
			if (data.success) {
				signupError = '';
				alert('Registration successful! Please log in.');
				isLoginView = true;
				username = '';
				password = '';
				confirmPassword = '';
			} else {
				signupError = data.error || 'Registration failed';
			}
		} catch (error) {
			console.error('Signup error:', error);
			signupError = 'Server error';
		}
	}

	function toggleView() {
		isLoginView = !isLoginView;
		username = '';
		password = '';
		confirmPassword = '';
		loginError = '';
		signupError = '';
	}

	function handleLogout() {
		isAuthenticated = false;
		isMainPage = false;
		username = '';
		password = '';
		confirmPassword = '';
		loginError = '';
		signupError = '';
		drawingBoard?.reset({ webStorage: false });
		
		// Remove the drawing board toolbar
		const toolbar = document.querySelector('.drawing-board-toolbar');
		if (toolbar) {
			toolbar.remove();
		}
	}

	async function handleEnterMainPage() {
		isMainPage = true;
		await tick();
		await initDrawingBoard();
	}

	let promptTxt = '';
	let strength = '0.85';
	let imagesReturned = '0';
	let isLoading = false;
	let isUploading = false;
	let isOutputControlAdded = false;
	let isSuccessfulGeneration = false;
	let drawingBoard: any;
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null;
	let noiseTs: DOMHighResTimeStamp;
	let imageTs: DOMHighResTimeStamp;
	let drawNextImage: () => void;
	let interval: ReturnType<typeof setInterval>;
	let canvasSize = 400;
	let canvasContainerEl: HTMLDivElement;
	let fileInput: HTMLInputElement;
	let sketchEl: HTMLCanvasElement;
	let isShowSketch = false;
	let outputImgs: CanvasImageSource[] = [];
	let outputFiles: {sketch: File, generations: File[]};

	const animImageDuration = 500 as const;
	const animNoiseDuration = 3000 as const;

	async function drawNoise() {
		if (!ctx) {
			return;
		}

		const imageData = ctx.createImageData(canvas.width, canvas.height);
		const pix = imageData.data;

		for (let i = 0, n = pix.length; i < n; i += 4) {
			const c = 7;
			pix[i] = 40 * Math.random() * c; // Set a random gray
			pix[i + 1] = 40 * Math.random() * c; // Set a random gray
			pix[i + 2] = 40 * Math.random() * c; // Set a random gray
			pix[i + 3] = 10; // 10/255th opaque
		}

		const bitmap = await createImageBitmap(imageData);

		const duration = performance.now() - noiseTs;
		ctx.globalAlpha = Math.min(duration, animNoiseDuration) / animNoiseDuration;
		ctx.drawImage(bitmap, 0, 0, canvasSize, canvasSize);

		if (isLoading) {
			window.requestAnimationFrame(drawNoise);
		}
	}

	function drawImage(image: CanvasImageSource) {
		if (!ctx) {
			return;
		}

		const duration = performance.now() - imageTs;
		ctx.globalAlpha = Math.min(duration, animImageDuration) / animImageDuration;
		ctx.drawImage(image, 0, 0, canvasSize, canvasSize);

		if (duration < animImageDuration) {
			window.requestAnimationFrame(() => drawImage(image));
		}
	}

	async function getCanvasSnapshot(
		canvas: HTMLCanvasElement
	): Promise<{ imgFile: File; imgBitmap: ImageBitmap }> {
		// Create a temporary canvas to ensure white background
		const tempCanvas = document.createElement('canvas');
		tempCanvas.width = canvasSize;
		tempCanvas.height = canvasSize;
		const tempCtx = tempCanvas.getContext('2d')!;
		tempCtx.fillStyle = 'white';
		tempCtx.fillRect(0, 0, canvasSize, canvasSize);
		tempCtx.drawImage(canvas, 0, 0);

		const canvasDataUrl = tempCanvas.toDataURL('image/png');
		const res = await fetch(canvasDataUrl);
		const blob = await res.blob();
		const imgFile = new File([blob], 'canvas_shot.png', { type: 'image/png' });
		const imgData = tempCtx.getImageData(0, 0, canvasSize, canvasSize);
		const imgBitmap = await createImageBitmap(imgData);
		return { imgFile, imgBitmap };
	}

	async function submitRequest() {
		if (!promptTxt) {
			return alert('Please add prompt');
		}

		if (!canvas || !ctx) {
			return;
		}

		if (interval) {
			clearInterval(interval);
		}
		isLoading = true;
		isShowSketch = false;
		isSuccessfulGeneration = false;
		copySketch();

		// start noise animation
		noiseTs = performance.now();
		drawNoise();

		const { imgFile: sketch, imgBitmap: initialSketchBitmap } = await getCanvasSnapshot(canvas);
		const form = new FormData();
		form.append('prompt', promptTxt);
		form.append('strength', strength);
		form.append('image', sketch);

		try {
			const response = await fetch('https://sdb.pcuenca.net/i2i', {
				method: 'POST',
				body: form
			});

			const json = JSON.parse(await response.text());

			const { images: imagesBase64Strs }: { images: string[] } = json;

			imagesReturned=imagesBase64Strs.length.toString();

			if (!imagesBase64Strs.length) {
				return alert(
					'All the results were flagged. Please try again with diffeerent sketch + prompt'
				);
			}

			outputImgs = (await Promise.all(
				imagesBase64Strs.map(async (imgBase64Str) => {
					const imgEl = new Image();
					imgEl.src = `data:image/png;base64, ${imgBase64Str}`;
					// await image.onload
					await new Promise((resolve, _) => {
						imgEl.onload = () => resolve(imgEl);
					});
					return imgEl;
				})
			)) as CanvasImageSource[];
			outputImgs.push(initialSketchBitmap);

			outputFiles = {
				sketch,
				generations: (await Promise.all(
					imagesBase64Strs.map(async (imgBase64Str) => {
						const dataUrl = `data:image/jpeg;base64, ${imgBase64Str}`;
						const res: Response = await fetch(dataUrl);
						const blob: Blob = await res.blob();
						const imgId = Date.now() % 200;
						const fileName = `diffuse-the-rest-${imgId}.jpeg`;
						return new File([blob], fileName, { type: 'image/jpeg' });
					})
				)) as File[]
			};

			isShowSketch = true;
			let i = 0;
			imageTs = performance.now();
			drawImage(outputImgs[i % outputImgs.length]);
			drawNextImage = () => {
				if (interval) {
					clearInterval(interval);
				}
				imageTs = performance.now();
				i = i + 1;
				drawImage(outputImgs[i % outputImgs.length]);
			};
			interval = setInterval(() => {
				i = i + 1;
				imageTs = performance.now();
				drawImage(outputImgs[i % outputImgs.length]);
			}, 2500);

			if (!isOutputControlAdded) {
				addOutputControl();
			}
			isSuccessfulGeneration = true;
		} catch (err) {
			console.error(err);
			alert('Error happened, queue might be full. Please try again in a bit :)');
		} finally {
			isLoading = false;
		}
	}

	function createDraggableToolbar() {
		const toolbar = document.createElement('div');
		toolbar.className = 'drawing-board-toolbar';

		// Add drag functionality
		let isDragging = false;
		let currentX: number = 0;
		let currentY: number = 0;
		let initialX: number = 0;
		let initialY: number = 0;
		let xOffset: number = 0;
		let yOffset: number = 0;

		toolbar.addEventListener('mousedown', dragStart);
		document.addEventListener('mousemove', drag);
		document.addEventListener('mouseup', dragEnd);

		function dragStart(e: MouseEvent) {
			initialX = e.clientX - xOffset;
			initialY = e.clientY - yOffset;

			if (e.target === toolbar) {
				isDragging = true;
				toolbar.classList.add('dragging');
			}
		}

		function drag(e: MouseEvent) {
			if (isDragging) {
				e.preventDefault();
				currentX = e.clientX - initialX;
				currentY = e.clientY - initialY;

				xOffset = currentX;
				yOffset = currentY;

				setTranslate(currentX, currentY, toolbar);
			}
		}

		function dragEnd() {
			initialX = currentX;
			initialY = currentY;
			isDragging = false;
			toolbar.classList.remove('dragging');
		}

		function setTranslate(xPos: number, yPos: number, el: HTMLElement) {
			el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
		}

		return toolbar;
	}

	function addOutputControl() {
        const div = document.createElement('div');
        div.className = 'drawing-board-control';

        const btn = document.createElement('button');
        btn.innerHTML = '⏯';
        btn.style.backgroundColor = 'white'; // Set button background to white
        btn.onclick = drawNextImage;
        div.append(btn);

        const toolbar = document.querySelector('.drawing-board-toolbar');
        if (toolbar && outputImgs.length > 1) {
            toolbar.appendChild(div);
            isOutputControlAdded = true;
            canvasContainerEl.onclick = () => {
                if (interval) {
                    clearInterval(interval);
                }
            };
        }
    }

	function addClearCanvasControl() {
        const div = document.createElement('div');
        div.className = 'drawing-board-control';

        const btn = document.createElement('button');
        btn.innerHTML = '💣';
        btn.style.backgroundColor = 'white'; // Set button background to white
        btn.onclick = () => {
            if (ctx) {
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvasSize, canvasSize);
                ctx.clearRect(0, 0, canvasSize, canvasSize);
                outputImgs = [];
                isShowSketch = false;
            }
        };
        div.append(btn);

        const toolbar = document.querySelector('.drawing-board-toolbar');
        if (toolbar) {
            toolbar.appendChild(div);
        }
    }

	function addDownloadCanvasControl() {
        const div = document.createElement('div');
        div.className = 'drawing-board-control';

        const btn = document.createElement('button');
        btn.innerHTML = '💾';
        btn.style.backgroundColor = 'white'; // Set button background to white
        btn.onclick = () => {
            if (!canvas) {
                return;
            }
            // Create a temporary canvas to ensure white background
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvasSize;
            tempCanvas.height = canvasSize;
            const tempCtx = tempCanvas.getContext('2d')!;
            tempCtx.fillStyle = 'white';
            tempCtx.fillRect(0, 0, canvasSize, canvasSize);
            tempCtx.drawImage(canvas, 0, 0);

            const link = document.createElement('a');
            const imgId = Date.now() % 200;
            link.download = `diffuse-the-rest-${imgId}.png`;
            link.href = tempCanvas.toDataURL('image/png');
            link.click();
        };
        div.append(btn);

        const toolbar = document.querySelector('.drawing-board-toolbar');
        if (toolbar) {
            toolbar.appendChild(div);
        }
    }

	function copySketch() {
		const context = sketchEl.getContext('2d');

		//set dimensions
		sketchEl.width = canvas.width;
		sketchEl.height = canvas.height;

		//apply the old canvas to the new one
		context!.drawImage(canvas, 0, 0);
	}

	async function drawUploadedImg(file: File) {
		if (interval) {
			clearInterval(interval);
		}
		const imgEl = new Image();
		imgEl.src = URL.createObjectURL(file);
		// await image.onload
		await new Promise((resolve, _) => {
			imgEl.onload = () => resolve(imgEl);
		});
		const { width, height } = imgEl;
		// keep aspect ratio
		if (width == height) {
			ctx?.drawImage(imgEl, 0, 0, width, height, 0, 0, canvasSize, canvasSize);
		} else if (width > height) {
			const canvasHeight = Math.floor((canvasSize * height) / width);
			const padding = Math.floor((canvasSize - canvasHeight) / 2);
			ctx?.drawImage(imgEl, 0, 0, width, height, 0, padding, canvasSize, canvasHeight);
		} else {
			const canvasWidth = Math.floor((canvasSize * width) / height);
			const padding = Math.floor((canvasSize - canvasWidth) / 2);
			ctx?.drawImage(imgEl, 0, 0, width, height, padding, 0, canvasWidth, canvasSize);
		}
	}

	function onfImgUpload() {
		const file = fileInput.files?.[0];
		if (file) {
			drawUploadedImg(file);
		}
	}

	function handleDrop(e: DragEvent) {
		if (!e.dataTransfer?.files) {
			return;
		}
		e.preventDefault();
		const files = Array.from(e.dataTransfer.files);
		const file = files[0];
		drawUploadedImg(file);
	}

	function handlePaste(e: ClipboardEvent) {
		if (!e.clipboardData) {
			return;
		}
		const files = Array.from(e.clipboardData.files);
		if (files.length === 0) {
			return;
		}
		e.preventDefault();
		const file = files[0];
		drawUploadedImg(file);
	}

	function onKeyDown(e: KeyboardEvent) {
		if(isLoading){
			return e.preventDefault();
		}
		if (e.code === 'Enter') {
			e.preventDefault();
			submitRequest();
		}
	}

	function polyfillCreateImageBitmap() {
		if (!window.createImageBitmap) {
			(window as any).createImageBitmap = async function (
				image: ImageBitmapSource,
				sx?: number,
				sy?: number,
				sw?: number,
				sh?: number,
				options?: ImageBitmapOptions
			): Promise<ImageBitmap> {
				// Xử lý riêng cho ImageData
				if (image instanceof ImageData) {
					const canvas = document.createElement('canvas');
					const ctx = canvas.getContext('2d')!;
					canvas.width = image.width;
					canvas.height = image.height;
					ctx.putImageData(image, 0, 0);

					const img = new Image();
					img.src = canvas.toDataURL();

					await new Promise((resolve) => {
						img.onload = resolve;
					});

					return img as unknown as ImageBitmap;
				}

				// Xử lý các trường hợp khác (Blob, HTMLImageElement, etc.)
				const img = new Image();
				if (image instanceof Blob) {
					img.src = URL.createObjectURL(image);
				} else if (typeof image === 'string') {
					img.src = image;
				} else if (image instanceof HTMLCanvasElement) {
					img.src = image.toDataURL();
				} else {
					// HTMLImageElement, HTMLVideoElement, etc.
					img.src = (image as HTMLImageElement).src;
				}

				await new Promise((resolve, reject) => {
					img.onload = resolve;
					img.onerror = reject;
				});

				return img as unknown as ImageBitmap;
			};
		}
	}

	function makeLinksTargetBlank() {
		const linkEls = document.querySelectorAll('a');
		for (const linkEl of linkEls) {
			linkEl.target = '_blank';
		}
	}

	async function uploadFile(file: File): Promise<string> {
		const UPLOAD_URL = "https://huggingface.co/uploads";
		const response = await fetch(UPLOAD_URL, {
			method: "POST",
			headers: {
				"Content-Type": file.type,
				"X-Requested-With": "XMLHttpRequest",
			},
			body: file, /// <- File inherits from Blob
		});
		const url = await response.text();
		return url;
	}

	async function createCommunityPost() {
		isUploading = true;

		const files = [outputFiles.sketch, ...outputFiles.generations];
		console.log(files)
		const urls = await Promise.all(files.map((f) => uploadFile(f)));
		const htmlImgs = urls.map(url => `<img src="${url}" width="400" height="400">`);
		const descriptionMd = `#### Prompt:
${promptTxt}

#### Sketch:
<div style="display: flex; overflow: scroll; column-gap: 0.75rem;">
${htmlImgs[0]}
</div>

#### Generations:
<div style="display: flex; flex-wrap: wrap; column-gap: 0.75rem;">
${htmlImgs.slice(1).join("\n")}
</div>`;

		const params = new URLSearchParams({
			title: promptTxt,
			description: descriptionMd,
		});

		const paramsStr = params.toString();
		window.open(`https://huggingface.co/spaces/huggingface-projects/diffuse-the-rest/discussions/new?${paramsStr}`, '_blank');
		isUploading = false;
	}

	async function initDrawingBoard() {
		let waitCount = 0;
		while (!window.DrawingBoard && waitCount < 10) {
			await new Promise((r) => setTimeout(r, 100));
			waitCount++;
		}

		if (!window.DrawingBoard) {
			console.error("DrawingBoard library not loaded");
			return;
		}

		const { innerWidth: windowWidth } = window;
		canvasSize = Math.min(canvasSize, Math.floor(windowWidth * 0.75));
		canvasContainerEl.style.width = `${canvasSize}px`;
		canvasContainerEl.style.height = `${canvasSize}px`;
		sketchEl.style.width = `${canvasSize}px`;
		sketchEl.style.height = `${canvasSize}px`;

		await tick();

		// Create and add the draggable toolbar
		const toolbar = createDraggableToolbar();
		document.body.appendChild(toolbar);

		// Initialize DrawingBoard with all controls in the correct order
		drawingBoard = new window.DrawingBoard.Board('board-container', {
			size: 10,
			controls: [
				'Color',  // Color picker first
				{ Size: { type: 'dropdown' } },  // Size selector second
				{ DrawingMode: { pencil: true, eraser: true, filler: false } }  // Drawing tools last
			],
			webStorage: false,
			enlargeYourContainer: true
		});

		canvas = drawingBoard.canvas;
		ctx = canvas.getContext('2d');
		canvas.width = canvasSize;
		canvas.height = canvasSize;

		// Prevent drawing on the sketch canvas
		sketchEl.style.pointerEvents = 'none';

		canvas.ondragover = function (e) {
			e.preventDefault();
			return false;
		};

		// Move existing controls to the toolbar in the correct order
		const controls = document.querySelector('.drawing-board-controls');
		if (controls) {
			// Get controls in the desired order
			const colorControl = controls.querySelector('.drawing-board-control-colors');
			const sizeControl = controls.querySelector('.drawing-board-control-size');
			const drawingModeControl = controls.querySelector('.drawing-board-control-drawingmode');

			// Add controls to toolbar in the correct order
			if (colorControl) toolbar.appendChild(colorControl);
			if (sizeControl) toolbar.appendChild(sizeControl);
			if (drawingModeControl) toolbar.appendChild(drawingModeControl);

			// Add clear and save buttons
			addClearCanvasControl();
			addDownloadCanvasControl();

			// Remove the old controls container
			controls.remove();
		}

		makeLinksTargetBlank();
	}

	onMount(async () => {
		if (typeof createImageBitmap === 'undefined') {
			polyfillCreateImageBitmap();
		}
	});

	function toggleUserMenu() {
		showUserMenu = !showUserMenu;
	}

	function closeUserMenu() {
		showUserMenu = false;
	}

	function toggleSecurityModal() {
		showSecurityModal = !showSecurityModal;
		showUserMenu = false;
	}

	async function handleChangePassword() {
		if (!currentPassword || !newPassword || !confirmNewPassword) {
			securityError = 'Please fill in all fields';
			return;
		}

		if (newPassword !== confirmNewPassword) {
			securityError = 'New passwords do not match';
			return;
		}

		try {
			const response = await fetch('/api/auth', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					action: 'changePassword',
					username,
					currentPassword,
					newPassword
				})
			});

			const data = await response.json();
			if (data.success) {
				showSecurityModal = false;
				currentPassword = '';
				newPassword = '';
				confirmNewPassword = '';
				securityError = '';
				alert('Password changed successfully!');
			} else {
				securityError = data.error || 'Failed to change password';
			}
		} catch (error) {
			console.error('Change password error:', error);
			securityError = 'Server error';
		}
	}

	async function handleSendNotification() {
		if (!newNotificationMessage.trim()) {
			adminError = 'Please enter a notification message';
			return;
		}

		try {
			const response = await fetch('/api/auth', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					action: 'sendNotification',
					username: adminUsername,
					password: adminPassword,
					message: newNotificationMessage
				})
			});

			const data = await response.json();
			if (data.success) {
				notifications = data.notifications;
				currentNotification = notifications[notifications.length - 1];
				newNotificationMessage = '';
				adminError = '';
			} else {
				adminError = data.error || 'Failed to send notification';
			}
		} catch (error) {
			console.error('Send notification error:', error);
			adminError = 'Server error';
		}
	}

	function dismissNotification() {
		showNotification = false;
	}

	function toggleNotificationHistory() {
		showNotificationHistory = !showNotificationHistory;
		console.log("Notification History Toggled: ", showNotificationHistory);
		showUserMenu = false;
	}

	function togglePersonalInfoModal() {
		showPersonalInfoModal = !showPersonalInfoModal;
		showUserMenu = false;
		if (showPersonalInfoModal) {
			loadPersonalInfo();
		}
	}

	async function handleUpdatePersonalInfo() {
		if (!personalInfo.birthDate || !personalInfo.phoneNumber || !personalInfo.address || !personalInfo.company) {
			personalInfoError = 'Please fill in all fields';
			return;
		}

		try {
			const response = await fetch('/api/userInfo', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					action: 'updateUserInfo',
					username,
					userInfo: personalInfo
				})
			});

			const data = await response.json();
			if (data.success) {
				showPersonalInfoModal = false;
				personalInfoError = '';
				alert('Personal information updated successfully!');
			} else {
				personalInfoError = data.error || 'Failed to update personal information';
			}
		} catch (error) {
			console.error('Update personal info error:', error);
			personalInfoError = 'Server error';
		}
	}
</script>

<svelte:head>
	<link
		href="css/drawingboard.css"
		rel="stylesheet"
	/>
	<script src="https://code.jquery.com/jquery-1.12.4.min.js"></script>
	<script
		src="https://cdnjs.cloudflare.com/ajax/libs/drawingboard.js/0.4.2/drawingboard.min.js"></script>
	<script
		src="https://cdnjs.cloudflare.com/ajax/libs/iframe-resizer/4.3.1/iframeResizer.contentWindow.min.js"></script>
</svelte:head>

<svelte:window on:drop|preventDefault|stopPropagation={handleDrop} on:paste={handlePaste} />

{#if !isAuthenticated}
	<!-- Login / Signup Form -->
	<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 p-4">
		<div class="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl w-full max-w-sm transform transition-all duration-300 hover:scale-[1.02]">
			<div class="flex justify-between items-center mb-8">
				<h2 class="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
					{isLoginView ? 'Welcome Back' : 'Create Account'}
				</h2>
				<button 
					on:click={() => { 
						showAdminLoginModal = true;
						adminUsername = '';
						adminPassword = '';
						adminError = '';
					}}
					class="text-sm text-gray-600 hover:text-gray-800 transition duration-200"
				>
					( ADMIN )
				</button>
			</div>

			{#if isLoginView}
				<form on:submit={handleLogin} class="space-y-6">
					<div class="space-y-4">
						<div class="relative">
							<label for="username" class="block text-sm font-medium text-gray-700 mb-1">Username</label>
							<div class="relative">
								<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
									</svg>
								</div>
								<input
									id="username"
									type="text"
									bind:value={username}
									class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-200"
									required
									placeholder="Enter your username"
								/>
							</div>
						</div>
						<div class="relative">
							<label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
							<div class="relative">
								<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
									</svg>
								</div>
								<input
									id="password"
									type="password"
									bind:value={password}
									class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-200"
									required
									placeholder="Enter your password"
								/>
							</div>
						</div>
					</div>
					{#if loginError}
						<div class="p-3 bg-red-50 text-red-600 rounded-lg text-sm animate-fade-in">
							{loginError}
						</div>
					{/if}
					<button 
						type="submit" 
						class="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-4 rounded-xl transition duration-300 transform hover:scale-[1.02] hover:shadow-lg"
					>
						Login
					</button>
				</form>
				<p class="mt-6 text-center text-sm text-gray-600">
					Don't have an account?
					<button 
						on:click={toggleView} 
						class="text-purple-600 hover:text-purple-800 font-medium transition duration-200"
					>
						Sign up
					</button>
				</p>
			{:else}
				<form on:submit={handleSignup} class="space-y-6">
					<div class="space-y-4">
						<div class="relative">
							<label for="username" class="block text-sm font-medium text-gray-700 mb-1">Username</label>
							<div class="relative">
								<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
									</svg>
								</div>
								<input
									id="username"
									type="text"
									bind:value={username}
									class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-200"
									required
									placeholder="Choose a username"
								/>
							</div>
						</div>
						<div class="relative">
							<label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
							<div class="relative">
								<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
									</svg>
								</div>
								<input
									id="password"
									type="password"
									bind:value={password}
									class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-200"
									required
									placeholder="Create a password"
								/>
							</div>
						</div>
						<div class="relative">
							<label for="confirm-password" class="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
							<div class="relative">
								<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
									</svg>
								</div>
								<input
									id="confirm-password"
									type="password"
									bind:value={confirmPassword}
									class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-200"
									required
									placeholder="Confirm your password"
								/>
							</div>
						</div>
					</div>
					{#if signupError}
						<div class="p-3 bg-red-50 text-red-600 rounded-lg text-sm animate-fade-in">
							{signupError}
						</div>
					{/if}
					<button 
						type="submit" 
						class="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-4 rounded-xl transition duration-300 transform hover:scale-[1.02] hover:shadow-lg"
					>
						Sign Up
					</button>
				</form>
				<p class="mt-6 text-center text-sm text-gray-600">
					Already have an account?
					<button 
						on:click={toggleView} 
						class="text-purple-600 hover:text-purple-800 font-medium transition duration-200"
					>
						Login
					</button>
				</p>
			{/if}
		</div>
	</div>

	{#if showAdminLoginModal}
		<div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
			<div class="bg-white/90 backdrop-blur-sm rounded-xl p-8 max-w-md w-full mx-4 shadow-xl transform transition-all duration-300 scale-100 opacity-100 border border-gray-100">
				<div class="flex justify-between items-center mb-6">
					<h2 class="text-2xl font-bold text-gray-800">Admin Login</h2>
					<button on:click={() => { showAdminLoginModal = false; adminError = ''; }} class="text-gray-500 hover:text-gray-700 transition duration-200 p-1 hover:bg-gray-100 rounded-lg">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				{#if adminError}
					<div class="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm animate-fade-in border border-red-100">
						{adminError}
					</div>
				{/if}

				<form on:submit={handleAdminLogin} class="space-y-6">
					<div class="space-y-4">
						<div class="relative">
							<label for="admin-username" class="block text-sm font-medium text-gray-700 mb-1">Username</label>
							<div class="relative">
								<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
									</svg>
								</div>
								<input
									id="admin-username"
									type="text"
									bind:value={adminUsername}
									class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-200"
									required
									placeholder="Enter admin username"
								/>
							</div>
						</div>
						<div class="relative">
							<label for="admin-password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
							<div class="relative">
								<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
									</svg>
								</div>
								<input
									id="admin-password"
									type="password"
									bind:value={adminPassword}
									class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-200"
									required
									placeholder="Enter admin password"
								/>
							</div>
						</div>
					</div>
					<button type="submit" class="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-xl transition duration-300 transform hover:scale-[1.02] hover:shadow-lg">
						Login as Admin
					</button>
				</form>
			</div>
		</div>
	{/if}

	{#if showAdminPanel}
		<div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
			<div class="bg-white/90 backdrop-blur-sm rounded-xl p-8 max-w-4xl w-full mx-4 shadow-xl transform transition-all duration-300 scale-100 opacity-100 border border-gray-100">
				<div class="flex justify-between items-center mb-6">
					<h2 class="text-2xl font-bold text-gray-800">Admin Panel</h2>
					<button on:click={() => { showAdminPanel = false; adminError = ''; }} class="text-gray-500 hover:text-gray-700 transition duration-200 p-1 hover:bg-gray-100 rounded-lg">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				{#if adminError}
					<div class="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm animate-fade-in border border-red-100">
						{adminError}
					</div>
				{/if}

				<div class="mb-8">
					<div class="flex items-center space-x-4 mb-4">
						<h3 class="text-lg font-semibold text-gray-700">Send Notification</h3>
					</div>
					<div class="flex space-x-4">
						<div class="relative flex-1">
							<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
								</svg>
							</div>
							<input
								type="text"
								bind:value={newNotificationMessage}
								placeholder="Enter notification message..."
								class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-200"
							/>
						</div>
						<button
							on:click={handleSendNotification}
							class="px-6 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition duration-200 transform hover:scale-[1.02] hover:shadow-lg"
						>
							Send
						</button>
					</div>
				</div>

				<div class="mb-6">
					<p class="text-sm text-gray-600">Total Users: <span class="font-semibold text-purple-600">{users.length}</span></p>
				</div>

				<div class="overflow-x-auto rounded-xl border border-gray-100">
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="bg-gray-50">
							<tr>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Premium</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-gray-200">
							{#each users as user}
								<tr class="hover:bg-gray-50 transition duration-150">
									<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.username}</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										<button
											on:click={() => handleTogglePremium(user.username)}
											class="px-3 py-1 text-xs font-medium rounded-full transition duration-200 {user.premium ? 'bg-purple-100 text-purple-800 hover:bg-purple-200' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}"
										>
											{user.premium ? 'Premium' : 'Free'}
										</button>
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										<span class="px-3 py-1 text-xs font-medium rounded-full {user.isAdmin ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}">
											{user.isAdmin ? 'Admin' : 'User'}
										</span>
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{#if !user.isAdmin}
											<button
												on:click={() => handleDeleteUser(user.username)}
												class="text-red-600 hover:text-red-800 font-medium"
											>
												Delete
											</button>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	{/if}

	{#if showNotification && currentNotification}
		<div class="fixed top-0 left-0 right-0 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white p-4 z-50 animate-slide-in">
			<div class="max-w-4xl mx-auto flex items-center justify-between">
				<div class="flex-1 overflow-hidden">
					<div class="animate-marquee whitespace-nowrap">
						{currentNotification.message}
					</div>
				</div>
				<button
					on:click={dismissNotification}
					class="ml-4 text-white opacity-50 hover:opacity-100 transition duration-200"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
		</div>
	{/if}

	{#if showNotificationHistory}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div class="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 shadow-xl transform transition-all duration-300 scale-100 opacity-100">
				<div class="flex justify-between items-center mb-4">
					<h2 class="text-xl font-bold text-gray-800">Notification History</h2>
					<button on:click={() => showNotificationHistory = false} class="text-gray-500 hover:text-gray-700 transition duration-200">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
				<div class="space-y-4 max-h-96 overflow-y-auto">
					{#each notifications as notification}
						<div class="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition duration-200">
							<div class="flex justify-between items-start">
								<p class="text-gray-700">{notification.message}</p>
								<span class="text-xs text-gray-500">{notification.timestamp}</span>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
{:else if isMainPage}
	<!-- MAIN PAGE -->
	<div class="flex justify-between p-4">
		<button on:click={handleUpgradePremium} class="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-xl transition duration-200 transform hover:scale-105">
			Upgrade Premium
		</button>

		{#if showNotification && currentNotification}
			<div class="flex-1 mx-4 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white p-2 rounded-lg animate-slide-in">
				<div class="flex items-center justify-between">
					<div class="flex-1 overflow-hidden">
						<div class="animate-marquee whitespace-nowrap">
							{currentNotification.message}
						</div>
					</div>
					<button
						on:click={dismissNotification}
						class="ml-4 text-white opacity-50 hover:opacity-100 transition duration-200"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			</div>
		{/if}

		<div class="relative">
			<button 
				on:click={toggleUserMenu}
				class="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-xl transition duration-200 transform hover:scale-105"
			>
				<svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
				</svg>
				<span class="font-medium">{username}</span>
				<svg class="w-4 h-4 transition-transform duration-200 {showUserMenu ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
				</svg>
			</button>

			{#if showUserMenu}
				<div 
					class="absolute right-0 mt-2 w-64 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg py-2 z-50 user-menu-enter border border-gray-100"
					transition:slide={{ duration: 300 }}
				>
					<div class="px-4 py-3 border-b border-gray-100">
						<p class="text-sm font-medium text-gray-900">{username}</p>
						<p class="text-xs text-gray-500 mt-1">{isPremium ? 'Premium User' : 'Free User'}</p>
					</div>
					<button 
						on:click={togglePersonalInfoModal}
						class="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 transition duration-150 group"
					>
						<svg class="w-4 h-4 mr-3 text-gray-500 group-hover:text-purple-500 transition duration-150" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
						</svg>
						<span class="group-hover:text-purple-600 transition duration-150">Personal Information</span>
					</button>
					<button 
						on:click={toggleSecurityModal}
						class="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 transition duration-150 group"
					>
						<svg class="w-4 h-4 mr-3 text-gray-500 group-hover:text-purple-500 transition duration-150" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
						</svg>
						<span class="group-hover:text-purple-600 transition duration-150">Security</span>
					</button>
					<button 
						on:click={() => {
							showUserMenu = false;
							showNotificationHistory = true;
						}}
						class="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 transition duration-150 group"
					>
						<svg class="w-4 h-4 mr-3 text-gray-500 group-hover:text-purple-500 transition duration-150" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
						</svg>
						<span class="group-hover:text-purple-600 transition duration-150">Notification</span>
						{#if notifications.length > 0}
							<span class="ml-auto bg-purple-500 text-white text-xs rounded-full px-2 py-1 group-hover:bg-purple-600 transition duration-150">
								{notifications.length}
							</span>
						{/if}
					</button>
					<button 
						on:click={handleLogout}
						class="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition duration-150 group mt-1 border-t border-gray-100"
					>
						<svg class="w-4 h-4 mr-3 text-red-500 group-hover:text-red-600 transition duration-150" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 11-6 0v-1m6 0H9" />
						</svg>
						<span class="group-hover:text-red-700 transition duration-150">Logout</span>
					</button>
				</div>
			{/if}
		</div>
	</div>

	{#if showSecurityModal}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div class="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl transform transition-all duration-300 scale-100 opacity-100">
				<div class="flex justify-between items-center mb-4">
					<h2 class="text-xl font-bold text-gray-800">Change Password</h2>
					<button on:click={() => showSecurityModal = false} class="text-gray-500 hover:text-gray-700 transition duration-200">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				{#if securityError}
					<div class="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm animate-fade-in">
						{securityError}
					</div>
				{/if}

				<div class="space-y-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
						<input
							type="password"
							bind:value={currentPassword}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition duration-200"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
						<input
							type="password"
							bind:value={newPassword}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition duration-200"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
						<input
							type="password"
							bind:value={confirmNewPassword}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition duration-200"
						/>
					</div>
				</div>

				<div class="mt-6 flex justify-end space-x-3">
					<button
						on:click={() => showSecurityModal = false}
						class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition duration-200"
					>
						Cancel
					</button>
					<button
						on:click={handleChangePassword}
						class="px-4 py-2 text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 rounded-lg transition duration-200 transform hover:scale-105"
					>
						Change Password
					</button>
				</div>
			</div>
		</div>
	{/if}

	{#if showPremiumModal}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
			<div class="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
				<div class="flex justify-between items-start mb-6">
					<h2 class="text-3xl font-bold text-gray-800">Upgrade to Premium</h2>
					<button on:click={closePremiumModal} class="text-gray-500 hover:text-gray-700">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
					<div class="bg-gray-50 p-6 rounded-lg">
						<h3 class="text-xl font-semibold mb-4">Free Plan</h3>
						<ul class="space-y-3 text-gray-600">
							<li class="flex items-center">
								<svg class="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
								Basic drawing tools
							</li>
							<li class="flex items-center">
								<svg class="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
								Strength limit: 0.85
							</li>
							<li class="flex items-center">
								<svg class="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
								Basic image generation
							</li>
						</ul>
					</div>

					<div class="bg-yellow-50 p-6 rounded-lg border-2 border-yellow-500">
						<div class="flex justify-between items-center mb-4">
							<h3 class="text-xl font-semibold">Premium Plan</h3>
							<span class="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium">Popular</span>
						</div>
						<ul class="space-y-3 text-gray-600">
							<li class="flex items-center">
								<svg class="w-5 h-5 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
								Unlimited Strength control
							</li>
							<li class="flex items-center">
								<svg class="w-5 h-5 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
								Priority image generation
							</li>
							<li class="flex items-center">
								<svg class="w-5 h-5 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
								Advanced drawing tools
							</li>
						</ul>
					</div>
				</div>

				<div class="flex justify-center">
					<button 
						on:click={confirmUpgrade}
						class="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-8 rounded-xl text-lg transition duration-300 transform hover:scale-105"
					>
						Upgrade Now
					</button>
				</div>
			</div>
		</div>
	{/if}

	{#if showPersonalInfoModal}
		<div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
			<div class="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl transform transition-all duration-300 scale-100 opacity-100">
				<div class="flex justify-between items-center mb-4">
					<h2 class="text-xl font-bold text-gray-800">Personal Information</h2>
					<button on:click={() => showPersonalInfoModal = false} class="text-gray-500 hover:text-gray-700 transition duration-200">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				{#if personalInfoError}
					<div class="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm animate-fade-in">
						{personalInfoError}
					</div>
				{/if}

				<div class="space-y-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
						<input
							type="date"
							bind:value={personalInfo.birthDate}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-200"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
						<input
							type="tel"
							bind:value={personalInfo.phoneNumber}
							placeholder="Enter your phone number"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-200"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Address</label>
						<textarea
							bind:value={personalInfo.address}
							placeholder="Enter your address"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-200 min-h-[80px]"
						></textarea>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Company</label>
						<input
							type="text"
							bind:value={personalInfo.company}
							placeholder="Enter your company name"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-200"
						/>
					</div>
				</div>

				<div class="mt-6 flex justify-end space-x-3">
					<button
						on:click={() => showPersonalInfoModal = false}
						class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition duration-200"
					>
						Cancel
					</button>
					<button
						on:click={handleUpdatePersonalInfo}
						class="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition duration-200 transform hover:scale-105"
					>
						Save Changes
					</button>
				</div>
			</div>
		</div>
	{/if}

	<div class="gray-bar top-bar"></div>
	<div class="flex flex-wrap gap-x-4 gap-y-2 justify-center my-0 bg-white text-black">
		<canvas bind:this={sketchEl} class="border-[1.2px] desktop:mt-[34px] {isShowSketch ? '' : 'hidden'}" />

		<div class="flex flex-col items-center {isLoading ? 'pointer-events-none' : ''}">
			<div id="board-container" bind:this={canvasContainerEl} class="relative" />
			<div class="gray-bar top-bar"></div> 
			<div class="flex gap-x-2 mt-3 items-center justify-center">
				<div class="bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-lg border border-gray-100">
					<p class="font-bold text-gray-700 mb-2">Strength: {strength}</p>
					<div class="strength-slider-container">
						<input
							type="range"
							min="0"
							max="1"
							step="0.01"
							bind:value={strength}
							class="strength-slider"
							on:change={handleStrengthChange}
						/>
					</div>
				</div>
			</div>
			<div class="flex gap-x-2 mt-3 items-start justify-center">
				<div class="bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-lg border border-gray-100 w-full max-w-2xl">
					<p class="font-bold text-gray-700 mb-2">Prompt</p>
					<div class="relative">
						<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
							</svg>
						</div>
						<textarea
							class="w-full min-h-[50px] max-h-[150px] py-3 px-10 border-2 border-gray-200 rounded-xl shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition duration-200 bg-white/50 backdrop-blur-sm resize-y font-medium text-gray-700 placeholder-gray-400 tracking-wide leading-relaxed"
							placeholder="Enter your prompt here..."
							bind:value={promptTxt}
							on:keydown={onKeyDown}
							maxlength="1000"
						></textarea>
						<div class="absolute bottom-2 right-2 text-xs text-gray-400">
							{1000 - (promptTxt?.length || 0)} chars left
						</div>
					</div>
				</div>
			</div>
			<div class="flex gap-x-2 mt-3 items-start justify-center {isLoading ? 'animate-pulse' : ''}">
				<button 
					on:click={submitRequest} 
					class="relative group bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/50"
				>
					<span class="absolute inset-0 w-full h-full mt-1 ml-1 transition-all duration-300 bg-black rounded-xl group-hover:mt-0 group-hover:ml-0"></span>
					<span class="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl"></span>
					<span class="relative flex items-center space-x-2">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
						</svg>
						<span>Let's go 🪄</span>
					</span>
				</button>
			</div>
			<div class="mt-4">
				<label class="relative group inline-flex items-center justify-center px-6 py-3 font-bold text-white transition-all duration-300 transform bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl hover:scale-105 hover:shadow-lg hover:shadow-purple-500/50 cursor-pointer">
					<span class="absolute inset-0 w-full h-full mt-1 ml-1 transition-all duration-300 bg-black rounded-xl group-hover:mt-0 group-hover:ml-0"></span>
					<span class="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl"></span>
					<span class="relative flex items-center space-x-2">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
						</svg>
						<span>Upload Image</span>
					</span>
					<input
						accept="image/*"
						bind:this={fileInput}
						on:change={onfImgUpload}
						style="display: none;"
						type="file"
					/>
				</label>
				<p class="hidden desktop:inline mt-2 text-gray-500 text-sm">
					pro tip: upload img by dropping on the canvas
				</p>
			</div>
			<div>
				<p class="my-4">Images returned: {imagesReturned}</p>
			</div>
		</div>
	</div>
	<!-- <div class="gray-bar bottom-bar"></div> -->

	<!-- Share to Community Button -->
	<div class="fixed bottom-4 right-4 z-40">
		<a 
			href="/page2" 
			class="group relative inline-flex items-center justify-center px-6 py-3 font-bold text-white transition-all duration-300 transform bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-xl hover:scale-105 hover:shadow-lg hover:shadow-pink-500/50"
		>
			<span class="absolute inset-0 w-full h-full mt-1 ml-1 transition-all duration-300 bg-black rounded-xl group-hover:mt-0 group-hover:ml-0"></span>
			<span class="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-xl"></span>
			<span class="absolute bottom-0 right-0 w-8 h-8 -mb-1 -mr-1 transition-all duration-300 transform translate-x-1 translate-y-1 bg-gradient-to-r from-purple-500 to-pink-500 group-hover:translate-x-0 group-hover:translate-y-0"></span>
			<span class="relative flex items-center space-x-2">
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
				</svg>
				<span>Share to Community</span>
			</span>
		</a>
	</div>
{/if}

<style>
	.gray-bar {
		width: 100%;
		height: 12px;
		background-color: #ffffff;
	}
	span[contenteditable]:empty::before {
		content: var(--placeholder);
		color: rgba(156, 163, 175);
	}

	.strength-slider-container {
		width: 200px;
		padding: 0 10px;
		background: linear-gradient(to right, 
			rgba(255, 0, 0, 0.1), rgba(255, 128, 0, 0.1), rgba(255, 255, 0, 0.1), 
			rgba(128, 255, 0, 0.1), rgba(0, 255, 0, 0.1), rgba(0, 255, 128, 0.1), 
			rgba(0, 255, 255, 0.1), rgba(0, 128, 255, 0.1), rgba(0, 0, 255, 0.1), 
			rgba(128, 0, 255, 0.1), rgba(255, 0, 255, 0.1), rgba(255, 0, 128, 0.1), 
			rgba(255, 0, 0, 0.1));
		border-radius: 8px;
	}

	.strength-slider {
		-webkit-appearance: none;
		width: 100%;
		height: 8px;
		border-radius: 4px;
		background: linear-gradient(to right, 
			#ff0000, #ff8000, #ffff00, #80ff00, 
			#00ff00, #00ff80, #00ffff, #0080ff, 
			#0000ff, #8000ff, #ff00ff, #ff0080, #ff0000);
		outline: none;
		opacity: 0.7;
		transition: opacity 0.2s;
	}

	.strength-slider:hover {
		opacity: 1;
	}

	.strength-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: white;
		cursor: pointer;
		box-shadow: 0 0 4px rgba(0,0,0,0.3);
		transition: transform 0.1s, box-shadow 0.1s;
	}

	.strength-slider::-webkit-slider-thumb:hover {
		transform: scale(1.1);
		box-shadow: 0 0 6px rgba(0,0,0,0.4);
	}

	.strength-slider::-moz-range-thumb {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: white;
		cursor: pointer;
		box-shadow: 0 0 4px rgba(0,0,0,0.3);
		transition: transform 0.1s, box-shadow 0.1s;
	}

	.strength-slider::-moz-range-thumb:hover {
		transform: scale(1.1);
		box-shadow: 0 0 6px rgba(0,0,0,0.4);
	}

	/* Custom scrollbar for prompt input */
	[contenteditable]::-webkit-scrollbar {
		width: 6px;
		height: 6px;
	}

	[contenteditable]::-webkit-scrollbar-track {
		background: rgba(241, 241, 241, 0.5);
		border-radius: 3px;
	}

	[contenteditable]::-webkit-scrollbar-thumb {
		background: rgba(147, 51, 234, 0.5);
		border-radius: 3px;
	}

	[contenteditable]::-webkit-scrollbar-thumb:hover {
		background: rgba(147, 51, 234, 0.7);
	}

	/* Focus styles for prompt input */
	[contenteditable]:focus {
		outline: none;
		box-shadow: 0 0 0 2px rgba(147, 51, 234, 0.2);
	}

	/* Placeholder style */
	[contenteditable]:empty:before {
		content: attr(placeholder);
		color: #9ca3af;
		 pointer-events: none;
	}

	/* Modal animation */
	.modal-enter {
		animation: modalEnter 0.3s ease-out;
	}

	@keyframes modalEnter {
		from {
			opacity: 0;
			transform: scale(0.95);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	/* Custom scrollbar for prompt input */
	[contenteditable]::-webkit-scrollbar {
		width: 6px;
		height: 6px;
	}

	[contenteditable]::-webkit-scrollbar-track {
		background: #f1f1f1;
		border-radius: 3px;
	}

	[contenteditable]::-webkit-scrollbar-thumb {
		background: #888;
		border-radius: 3px;
	}

	[contenteditable]::-webkit-scrollbar-thumb:hover {
		background: #555;
	}

	/* Placeholder style */
	[contenteditable]:empty:before {
		content: attr(placeholder);
		color: #9ca3af;
		pointer-events: none;
	}

	/* Focus styles */
	[contenteditable]:focus {
		outline: none;
		box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2);
	}

	/* Smooth resize */
	[contenteditable] {
		transition: height 0.2s ease;
	}

	/* User menu animation */
	.user-menu-enter {
		animation: menuEnter 0.3s ease-out;
	}

	@keyframes menuEnter {
		from {
			opacity: 0;
			transform: translateY(-10px) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	/* Fade in animation */
	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.animate-fade-in {
		animation: fadeIn 0.3s ease-out;
	}

	/* Slide transition */
	.slide {
		animation: slide 0.3s ease-out;
	}

	@keyframes slide {
		from {
			opacity: 0;
			transform: translateY(-20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Admin panel styles */
	table {
		border-collapse: separate;
		border-spacing: 0;
	}

	th, td {
		padding: 0.75rem;
		text-align: left;
		border-bottom: 1px solid #e5e7eb;
	}

	th {
		background-color: #f9fafb;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	tr:hover {
		background-color: #f9fafb;
	}

	@keyframes slide-in {
		from {
			transform: translateY(-100%);
		}
		to {
			transform: translateY(0);
		}
	}

	.animate-slide-in {
		animation: slide-in 0.5s ease-out;
	}

	@keyframes marquee {
		0% {
			transform: translateX(100%);
		}
		100% {
			transform: translateX(-100%);
		}
	}

	.animate-marquee {
		animation: marquee 20s linear infinite;
	}

	/* Custom scrollbar for textarea */
	textarea::-webkit-scrollbar {
		width: 6px;
		height: 6px;
	}

	textarea::-webkit-scrollbar-track {
		background: rgba(241, 241, 241, 0.5);
		border-radius: 3px;
	}

	textarea::-webkit-scrollbar-thumb {
		background: rgba(147, 51, 234, 0.5);
		border-radius: 3px;
	}

	textarea::-webkit-scrollbar-thumb:hover {
		background: rgba(147, 51, 234, 0.7);
	}

	/* Focus styles for textarea */
	textarea:focus {
		outline: none;
		box-shadow: 0 0 0 2px rgba(147, 51, 234, 0.2);
	}

	/* Text animation */
	@keyframes textGlow {
		0% {
			text-shadow: 0 0 5px rgba(147, 51, 234, 0.2);
		}
		50% {
			text-shadow: 0 0 10px rgba(147, 51, 234, 0.3);
		}
		100% {
			text-shadow: 0 0 5px rgba(147, 51, 234, 0.2);
		}
	}

	textarea {
		animation: textGlow 3s infinite;
		transition: all 0.3s ease;
	}

	textarea:focus {
		animation: none;
		text-shadow: 0 0 8px rgba(147, 51, 234, 0.4);
	}

	/* Button hover effects */
	button.group:hover {
		transform: translateX(2px);
	}

	/* Smooth transitions */
	.transition {
		transition-property: all;
		transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
		transition-duration: 150ms;
	}
</style>