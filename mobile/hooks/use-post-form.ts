import { useCallback, useEffect } from 'react'
import { useForm } from './use-form'
import { useCliquesStore } from '../store/cliques.store'
import { usePostsStore } from '../store/posts.store'
import { showError, showSuccess } from '../store/app.store'
import type { CreatePostData } from '../types'

interface PostFormValues {
	caption: string
	content: string
	selectedCliqueId: number | null
	selectedLanguage: string
}

const initialValues: PostFormValues = {
	caption: '',
	content: '',
	selectedCliqueId: null,
	selectedLanguage: 'ALL',
}

const validate = (values: PostFormValues) => {
	const errors: Partial<Record<keyof PostFormValues, string>> = {}
	if (!values.caption.trim()) {
		errors.caption = 'Please enter post content'
	}
	if (!values.selectedCliqueId) {
		errors.selectedCliqueId = 'Please select a clique'
	}
	return errors
}

export function usePostForm(onSuccess?: () => void) {
	const { cliques, fetchCliques } = useCliquesStore()
	const { createPost } = usePostsStore()

	const form = useForm(initialValues, validate)

	const handleSubmit = useCallback(async () => {
		await form.handleSubmit(async values => {
			try {
				const postData: CreatePostData = {
					content: values.content.trim(),
					caption: values.caption.trim(),
					cliqueId: values.selectedCliqueId!,
				}
				await createPost(postData)
				showSuccess('Post created successfully')
				form.reset()
				onSuccess?.()
			} catch (error: any) {
				showError(error.message || 'Failed to create post')
			}
		})
	}, [form, createPost, onSuccess])

	useEffect(() => {
		fetchCliques()
	}, [fetchCliques])

	const cliqueOptions = cliques.map(clique => ({
		label: clique.name,
		value: clique.id,
	}))

	return {
		...form,
		handleSubmit,
		cliqueOptions,
	}
}

export default usePostForm
