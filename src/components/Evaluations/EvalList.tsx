'use client'

import { Fragment, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
	ArrowDownTrayIcon,
	ArrowTopRightOnSquareIcon,
	ArrowTrendingDownIcon,
	ArrowTrendingUpIcon,
	CheckIcon,
	CalendarDaysIcon,
	ChevronUpDownIcon,
	MagnifyingGlassIcon,
	XMarkIcon,
} from '@heroicons/react/24/outline'
import { Listbox, Popover, Transition } from '@headlessui/react'
import { DayPicker } from 'react-day-picker'
import { format } from 'date-fns'
import { cn, motionVariants, transitions } from '@/lib/design-system'
import EvalDetailModal from './EvalDetailModal'

export interface EvaluationRow {
	id: string
	interaction_id: string
	prompt: string
	response: string
	score: number
	amount?: number
	category?: string
	category_key?: string
	latency_ms: number
	flags?: unknown
	pii_tokens_redacted: number | null
	created_at: string
}

export interface EvalFilters {
	query: string
	category: string
	startDate: string
	endDate: string
}

type ExportFormat = 'csv' | 'json'

interface EvalListProps {
	evaluations: EvaluationRow[]
	page: number
	totalPages: number
	onPageChange: (page: number) => void
	filters: EvalFilters
	onFiltersChange: (filters: EvalFilters) => void
	onExport: (format: ExportFormat) => void
	exportingFormat?: ExportFormat | null
	loading?: boolean
	totalCount?: number
}

function statusBadge(score: number) {
	if (score >= 90) return 'bg-[#34C759]/15 text-[#34C759]'
	if (score >= 75) return 'bg-[#007AFF]/15 text-[#007AFF]'
	if (score >= 60) return 'bg-[#FF9500]/15 text-[#FF9500]'
	return 'bg-[#FF3B30]/15 text-[#FF3B30]'
}

function categoryBadge(categoryKey?: string) {
	if (categoryKey === 'error') return 'bg-[#FF3B30]/15 text-[#FF3B30]'
	if (categoryKey === 'timeout') return 'bg-[#FF9500]/15 text-[#FF9500]'
	if (categoryKey === 'slow_response' || categoryKey === 'warning') return 'bg-[#AF52DE]/15 text-[#AF52DE]'
	if (categoryKey === 'no_flags') return 'bg-[#8E8E93]/15 text-[#8E8E93]'
	return 'bg-[#34C759]/15 text-[#34C759]'
}

const categoryOptions = [
	{ value: 'all', label: 'All Categories' },
	{ value: 'no_flags', label: 'No Flags' },
	{ value: 'error', label: 'Error' },
	{ value: 'timeout', label: 'Timeout' },
	{ value: 'slow_response', label: 'Slow Response' },
	{ value: 'warning', label: 'Warning' },
]

function parseDateValue(value: string) {
	if (!value) return undefined

	const parts = value.split('-')
	if (parts.length !== 3) return undefined

	const year = Number(parts[0])
	const month = Number(parts[1])
	const day = Number(parts[2])

	if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
		return undefined
	}

	return new Date(year, month - 1, day)
}

function toDateValue(date: Date) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

function formatDateValue(value: string, fallback: string) {
	const parsed = parseDateValue(value)
	if (!parsed) {
		return fallback
	}

	return format(parsed, 'MMM d, yyyy')
}

function CategoryDropdown({
	value,
	onChange,
}: {
	value: string
	onChange: (value: string) => void
}) {
	const selected = categoryOptions.find((option) => option.value === value) || categoryOptions[0]

	return (
		<Listbox value={selected.value} onChange={onChange}>
			{({ open }) => (
				<div className={cn('relative', open ? 'z-[90]' : 'z-0')}>
					<Listbox.Button className="w-full rounded-xl border border-black/10 bg-white/90 px-3 py-2 text-left text-xs sm:text-sm text-[#1C1C1E] outline-none transition hover:border-[#007AFF]/35 focus:border-[#007AFF]/45 focus:ring-2 focus:ring-[#007AFF]/20 dark:border-white/10 dark:bg-white/10 dark:text-white">
						<span className="truncate pr-7">{selected.label}</span>
						<ChevronUpDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8E8E93]" />
					</Listbox.Button>

					<Transition
						as={Fragment}
						enter="transition ease-out duration-120"
						enterFrom="opacity-0 translate-y-1"
						enterTo="opacity-100 translate-y-0"
						leave="transition ease-in duration-90"
						leaveFrom="opacity-100 translate-y-0"
						leaveTo="opacity-0 translate-y-1"
					>
						<Listbox.Options className="absolute z-[95] mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-black/10 bg-white p-1.5 shadow-[0_14px_34px_rgba(0,0,0,0.24)] dark:border-white/10 dark:bg-[#151518]">
							{categoryOptions.map((option) => (
								<Listbox.Option
									key={option.value}
									value={option.value}
									className={({ active }) =>
										cn(
											'relative cursor-pointer select-none rounded-xl px-3 py-2 text-xs sm:text-sm transition',
											active
												? 'bg-[#007AFF]/12 text-[#007AFF]'
												: 'text-[#1C1C1E] dark:text-white'
										)
									}
								>
									{({ selected: isSelected }) => (
										<div className="flex items-center justify-between gap-2">
											<span className="truncate">{option.label}</span>
											{isSelected && <CheckIcon className="h-4 w-4 text-[#007AFF]" />}
										</div>
									)}
								</Listbox.Option>
							))}
						</Listbox.Options>
					</Transition>
				</div>
			)}
		</Listbox>
	)
}

function DateFilterPicker({
	label,
	value,
	onChange,
	minDate,
	maxDate,
}: {
	label: string
	value: string
	onChange: (value: string) => void
	minDate?: string
	maxDate?: string
}) {
	const selectedDate = parseDateValue(value)
	const min = parseDateValue(minDate || '')
	const max = parseDateValue(maxDate || '')

	const disabledDays: Array<{ before: Date } | { after: Date }> = []
	if (min) {
		disabledDays.push({ before: min })
	}
	if (max) {
		disabledDays.push({ after: max })
	}

	return (
		<Popover className="relative z-20">
			{({ open, close }) => (
				<div className={cn('relative', open ? 'z-[90]' : 'z-0')}>
					<Popover.Button
						className={cn(
							'flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-xs sm:text-sm outline-none transition',
							'border-black/10 bg-white/90 text-[#1C1C1E] hover:border-[#007AFF]/35 focus:border-[#007AFF]/45 focus:ring-2 focus:ring-[#007AFF]/20',
							'dark:border-white/10 dark:bg-white/10 dark:text-white',
							open && 'border-[#007AFF]/45 ring-2 ring-[#007AFF]/20'
						)}
					>
						<span className="inline-flex items-center gap-2 truncate">
							<CalendarDaysIcon className="h-4 w-4 text-[#8E8E93]" />
							{formatDateValue(value, label)}
						</span>
						<ChevronUpDownIcon className="h-4 w-4 text-[#8E8E93]" />
					</Popover.Button>

					<Transition
						as={Fragment}
						enter="transition ease-out duration-120"
						enterFrom="opacity-0 translate-y-1"
						enterTo="opacity-100 translate-y-0"
						leave="transition ease-in duration-90"
						leaveFrom="opacity-100 translate-y-0"
						leaveTo="opacity-0 translate-y-1"
					>
						<Popover.Panel className="absolute z-[95] mt-2 w-[292px] max-w-[calc(100vw-2rem)] rounded-2xl border border-black/10 bg-white p-3 shadow-[0_14px_34px_rgba(0,0,0,0.24)] dark:border-white/10 dark:bg-[#151518]">
							<DayPicker
								mode="single"
								selected={selectedDate}
								onSelect={(date) => {
									if (!date) return
									onChange(toDateValue(date))
									close()
								}}
								disabled={disabledDays.length > 0 ? disabledDays : undefined}
								showOutsideDays
								className="rdp-eval"
							/>
							<div className="mt-2 flex items-center justify-between border-t border-black/8 pt-2 text-xs dark:border-white/10">
								<button
									type="button"
									onClick={() => {
										onChange('')
										close()
									}}
									className="rounded-full px-2.5 py-1 font-medium text-[#8E8E93] transition hover:bg-black/5 hover:text-[#1C1C1E] dark:hover:bg-white/10 dark:hover:text-white"
								>
									Clear
								</button>
								<button
									type="button"
									onClick={() => {
										const today = new Date()
										onChange(toDateValue(today))
										close()
									}}
									className="rounded-full px-2.5 py-1 font-medium text-[#007AFF] transition hover:bg-[#007AFF]/12"
								>
									Today
								</button>
							</div>
						</Popover.Panel>
					</Transition>
				</div>
			)}
		</Popover>
	)
}

export default function EvalList({
	evaluations,
	page,
	totalPages,
	onPageChange,
	filters,
	onFiltersChange,
	onExport,
	exportingFormat,
	loading,
	totalCount,
}: EvalListProps) {
	const [selectedEval, setSelectedEval] = useState<EvaluationRow | null>(null)
	const [modalOpen, setModalOpen] = useState(false)

	const tableData = useMemo(() => {
		return (evaluations ?? []).map((item) => ({
			...item,
			categoryDisplay: item.category || 'No Flags',
			categoryKey: item.category_key || 'no_flags',
			amountDisplay: typeof item.amount === 'number' ? item.amount : item.score,
			createdDisplay: new Date(item.created_at).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
			}),
		}))
	}, [evaluations])

	const hasActiveFilters =
		filters.query.trim().length > 0 ||
		filters.category !== 'all' ||
		filters.startDate.length > 0 ||
		filters.endDate.length > 0
	const hasRows = (totalCount ?? evaluations.length) > 0
	const isExporting = exportingFormat === 'csv' || exportingFormat === 'json'

	const updateFilters = (partial: Partial<EvalFilters>) => {
		onFiltersChange({
			...filters,
			...partial,
		})
	}

	const handleStartDateChange = (nextStartDate: string) => {
		const nextEndDate =
			filters.endDate && nextStartDate && filters.endDate < nextStartDate
				? nextStartDate
				: filters.endDate

		onFiltersChange({
			...filters,
			startDate: nextStartDate,
			endDate: nextEndDate,
		})
	}

	const handleEndDateChange = (nextEndDate: string) => {
		const normalizedEndDate =
			filters.startDate && nextEndDate && nextEndDate < filters.startDate
				? filters.startDate
				: nextEndDate

		onFiltersChange({
			...filters,
			endDate: normalizedEndDate,
		})
	}

	const handleInspectClick = (evaluation: EvaluationRow, e: React.MouseEvent) => {
		e.stopPropagation()
		setSelectedEval(evaluation)
		setModalOpen(true)
	}

	return (
		<motion.section
			className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/60 bg-white/85 shadow-[0_2px_8px_rgba(0,0,0,0.04)] backdrop-blur-3xl dark:border-white/10 dark:bg-[#1D1D1F]/85 dark:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
			variants={motionVariants.fadeUp}
			initial="hidden"
			animate="show"
			transition={transitions.default}
		>
			<div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between gap-3 border-b border-white/50 bg-white/70 px-4 sm:px-6 py-4 sm:py-5 backdrop-blur-xl dark:border-white/10 dark:bg-[#1D1D1F]/80">
				<div>
					<h2 className="text-base sm:text-lg font-semibold tracking-tight text-[#1C1C1E] dark:text-white">
						Evaluation Stream
					</h2>
					<p className="text-xs sm:text-sm text-[#8E8E93]">
						Showing {(evaluations ?? []).length} of {totalCount ?? '—'} matching evaluations
					</p>
				</div>
				<div className="flex items-center flex-wrap gap-2 text-[10px] sm:text-xs text-[#8E8E93]">
					<span className="inline-flex items-center gap-1 rounded-full bg-[#007AFF]/10 px-2 sm:px-3 py-0.5 sm:py-1 text-[#007AFF]">
						<ArrowTrendingUpIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> <span className="hidden sm:inline">Higher score = better</span><span className="sm:hidden">Better</span>
					</span>
					<span className="inline-flex items-center gap-1 rounded-full bg-[#FF3B30]/10 px-2 sm:px-3 py-0.5 sm:py-1 text-[#FF3B30]">
						<ArrowTrendingDownIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> <span className="hidden sm:inline">Monitor latency spikes</span><span className="sm:hidden">Latency</span>
					</span>
				</div>
			</div>

			<div className="relative z-20 border-b border-white/50 bg-white/65 px-4 sm:px-6 py-3 sm:py-4 backdrop-blur-xl dark:border-white/10 dark:bg-[#1D1D1F]/75">
				<div className="grid gap-2 sm:gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,0.95fr)_minmax(0,0.95fr)_auto]">
					<div className="relative">
						<MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8E8E93]" />
						<input
							type="text"
							value={filters.query}
							onChange={(event) => updateFilters({ query: event.target.value })}
							placeholder="Search interaction, prompt, or response"
							className="w-full rounded-xl border border-black/10 bg-white/85 py-2 pl-9 pr-3 text-xs sm:text-sm text-[#1C1C1E] outline-none transition focus:border-[#007AFF]/45 focus:ring-2 focus:ring-[#007AFF]/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
						/>
					</div>

					<CategoryDropdown
						value={filters.category}
						onChange={(value) => updateFilters({ category: value })}
					/>

					<DateFilterPicker
						label="Start Date"
						value={filters.startDate}
						onChange={handleStartDateChange}
						maxDate={filters.endDate || undefined}
					/>

					<DateFilterPicker
						label="End Date"
						value={filters.endDate}
						onChange={handleEndDateChange}
						minDate={filters.startDate || undefined}
					/>

					<button
						type="button"
						onClick={() =>
							onFiltersChange({
								query: '',
								category: 'all',
								startDate: '',
								endDate: '',
							})
						}
						disabled={!hasActiveFilters}
						className={cn(
							'inline-flex items-center justify-center gap-1 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium transition',
							hasActiveFilters
								? 'bg-[#007AFF]/10 text-[#007AFF] hover:bg-[#007AFF]/15'
								: 'cursor-not-allowed bg-black/5 text-[#8E8E93] dark:bg-white/5 dark:text-[#EBEBF5]/55'
						)}
					>
						<XMarkIcon className="h-4 w-4" />
						Clear
					</button>
				</div>

				<div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<p className="text-[11px] sm:text-xs text-[#8E8E93]">
						{hasActiveFilters
							? 'Export will include your active filters.'
							: 'Export will include all evaluations in this dataset.'}
					</p>
					<div className="flex flex-wrap items-center gap-2">
						<button
							type="button"
							onClick={() => onExport('csv')}
							disabled={!hasRows || loading || isExporting}
							className={cn(
								'inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition',
								!hasRows || loading || isExporting
									? 'cursor-not-allowed bg-black/5 text-[#8E8E93] dark:bg-white/5 dark:text-[#EBEBF5]/55'
									: 'bg-[#007AFF]/12 text-[#007AFF] hover:bg-[#007AFF]/18'
							)}
						>
							<ArrowDownTrayIcon className="h-3.5 w-3.5" />
							{exportingFormat === 'csv' ? 'Exporting CSV...' : 'Export CSV'}
						</button>
						<button
							type="button"
							onClick={() => onExport('json')}
							disabled={!hasRows || loading || isExporting}
							className={cn(
								'inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition',
								!hasRows || loading || isExporting
									? 'cursor-not-allowed bg-black/5 text-[#8E8E93] dark:bg-white/5 dark:text-[#EBEBF5]/55'
									: 'bg-[#1C1C1E]/10 text-[#1C1C1E] hover:bg-[#1C1C1E]/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/15'
							)}
						>
							<ArrowDownTrayIcon className="h-3.5 w-3.5" />
							{exportingFormat === 'json' ? 'Exporting JSON...' : 'Export JSON'}
						</button>
					</div>
				</div>
			</div>

			<div className="relative z-0 overflow-x-auto">
				<table className="min-w-full table-auto">
					<thead className="sticky top-0 z-10 bg-white/90 text-left text-[10px] sm:text-xs uppercase tracking-[0.24em] text-[#8E8E93] backdrop-blur-xl dark:bg-[#1D1D1F]/90">
						<tr>
							<th className="px-3 sm:px-6 py-3 sm:py-4 font-medium whitespace-nowrap">Interaction</th>
							<th className="px-3 sm:px-6 py-3 sm:py-4 font-medium whitespace-nowrap">Category</th>
							<th className="px-3 sm:px-6 py-3 sm:py-4 font-medium whitespace-nowrap">Score</th>
							<th className="px-3 sm:px-6 py-3 sm:py-4 font-medium whitespace-nowrap">Date</th>
							<th className="px-3 sm:px-6 py-3 sm:py-4 font-medium whitespace-nowrap">Latency</th>
							<th className="px-3 sm:px-6 py-3 sm:py-4 text-right font-medium whitespace-nowrap">Action</th>
						</tr>
					</thead>
					<tbody>
						<AnimatePresence initial={false}>
							{tableData.map((evaluation, index) => (
								<motion.tr
									key={evaluation.id}
                                    onClick={(e) => handleInspectClick(evaluation, e)}
									className={cn(
										'cursor-pointer border-t border-white/40 text-xs sm:text-sm transition duration-200 first:border-t-0 dark:border-white/10',
										index % 2 === 0
											? 'bg-white/85 dark:bg-white/5'
											: 'bg-white/75 dark:bg-white/10'
									)}
									whileHover={{ scale: 1.001, translateY: -1 }}
									layout
								>
									<td className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-[#007AFF] whitespace-nowrap">
										{evaluation.interaction_id}
									</td>
									<td className="px-3 sm:px-6 py-3 sm:py-4">
										<span
											className={cn(
												'inline-flex rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold backdrop-blur-xl',
												categoryBadge(evaluation.categoryKey)
											)}
										>
											{evaluation.categoryDisplay}
										</span>
									</td>
									<td className="px-3 sm:px-6 py-3 sm:py-4">
										<span
											className={cn(
												'inline-flex items-center gap-1 sm:gap-2 rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold backdrop-blur-xl',
												statusBadge(evaluation.amountDisplay)
											)}
										>
											{evaluation.amountDisplay.toFixed(1)}
										</span>
									</td>
									<td className="px-3 sm:px-6 py-3 sm:py-4 text-[#8E8E93] dark:text-[#EBEBF5]/70 whitespace-nowrap text-xs sm:text-sm">
										{evaluation.createdDisplay}
									</td>
									<td className="px-3 sm:px-6 py-3 sm:py-4 text-[#8E8E93] dark:text-[#EBEBF5]/70 whitespace-nowrap">
										{evaluation.latency_ms} ms
									</td>
									<td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
										<button
											onClick={(e) => handleInspectClick(evaluation, e)}
											className="inline-flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs font-semibold text-[#007AFF] transition hover:text-[#0066CC]"
										>
											<span className="hidden sm:inline">Inspect</span>
											<span className="sm:hidden">View</span>
											<ArrowTopRightOnSquareIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
										</button>
									</td>
								</motion.tr>
							))}
						</AnimatePresence>
					</tbody>
				</table>
			</div>

			<div className="flex flex-col items-center justify-between gap-3 border-t border-white/40 bg-white/75 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-[#8E8E93] backdrop-blur-xl sm:flex-row dark:border-white/10 dark:bg-[#1D1D1F]/80">
				<div>
					Page {page} of {totalPages || 1}
				</div>
				<div className="flex items-center gap-2">
					<motion.button
						type="button"
						onClick={() => onPageChange(Math.max(1, page - 1))}
						disabled={page === 1 || loading}
						whileTap={{ scale: 0.97 }}
						className={cn(
							'rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition',
							page === 1 || loading
								? 'cursor-not-allowed bg-white/50 text-[#C8C8CC] dark:bg-white/5'
								: 'bg-[#007AFF]/10 text-[#007AFF] hover:scale-[1.02] hover:bg-[#007AFF]/15'
						)}
					>
						<span className="hidden sm:inline">Previous</span>
						<span className="sm:hidden">Prev</span>
					</motion.button>
					<motion.button
						type="button"
						onClick={() => onPageChange(Math.min(totalPages || 1, page + 1))}
						disabled={page === totalPages || loading}
						whileTap={{ scale: 0.97 }}
						className={cn(
							'rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition',
							page === totalPages || loading
								? 'cursor-not-allowed bg-white/50 text-[#C8C8CC] dark:bg-white/5'
								: 'bg-[#007AFF] text-white shadow-[0_4px_12px_rgba(0,122,255,0.2)] hover:scale-[1.02]'
						)}
					>
						Next
					</motion.button>
				</div>
			</div>

			<EvalDetailModal
				evaluation={selectedEval}
				isOpen={modalOpen}
				onClose={() => setModalOpen(false)}
			/>
		</motion.section>
	)
}
