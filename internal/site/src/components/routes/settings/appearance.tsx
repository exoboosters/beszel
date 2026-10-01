import { Trans, useLingui } from "@lingui/react/macro"
import { redirectPage } from "@nanostores/router"
import { EyeIcon, LoaderCircleIcon, PaletteIcon, RotateCcwIcon, SaveIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { $router } from "@/components/router"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { isAdmin, pb } from "@/lib/api"
import { $appearanceSettings } from "@/lib/stores"
import { validateSvg } from "@/lib/svg-utils"
import type { AppearanceSettings } from "@/types"

export default function AppearanceSettingsPage() {
	const { t } = useLingui()

	const [svgInput, setSvgInput] = useState("")
	const [textColorLight, setTextColorLight] = useState("")
	const [textColorDark, setTextColorDark] = useState("")
	const [isLoading, setIsLoading] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [previewSvg, setPreviewSvg] = useState("")
	const [svgError, setSvgError] = useState<string | null>(null)

	if (!isAdmin()) {
		redirectPage($router, "settings", { name: "general" })
	}

	useEffect(() => {
		async function loadSettings() {
			setIsLoading(true)
			try {
				const data = await pb.send<AppearanceSettings>("/api/beszel/appearance", {})
				setSvgInput(data.customLogo ?? "")
				setTextColorLight(data.textColorLight ?? "")
				setTextColorDark(data.textColorDark ?? "")
				setPreviewSvg(data.customLogo ?? "")
			} catch (e) {
				console.error("failed to load appearance settings", e)
			} finally {
				setIsLoading(false)
			}
		}
		loadSettings()
	}, [])

	function handleSvgChange(val: string) {
		setSvgInput(val)
		if (!val.trim()) {
			setSvgError(null)
			setPreviewSvg("")
			return
		}
		const res = validateSvg(val)
		if (!res.valid) {
			setSvgError(res.error || t`Invalid SVG format`)
			setPreviewSvg("")
		} else {
			setSvgError(null)
			setPreviewSvg(val.trim())
		}
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()

		if (svgInput.trim()) {
			const res = validateSvg(svgInput)
			if (!res.valid) {
				toast({
					title: t`Invalid SVG`,
					description: res.error || t`Please fix SVG validation errors before saving.`,
					variant: "destructive",
				})
				return
			}
		}

		setIsSaving(true)
		try {
			const payload: AppearanceSettings = {
				customLogo: svgInput.trim(),
				textColorLight: textColorLight.trim(),
				textColorDark: textColorDark.trim(),
			}

			await pb.send("/api/beszel/appearance", {
				method: "POST",
				body: payload,
			})

			$appearanceSettings.set(payload)

			toast({
				title: t`Settings saved`,
				description: t`Global appearance settings updated successfully.`,
			})
		} catch (e: any) {
			console.error("save appearance error", e)
			toast({
				title: t`Failed to save settings`,
				description: e?.message || t`Check server logs for details.`,
				variant: "destructive",
			})
		} finally {
			setIsSaving(false)
		}
	}

	function handleResetDefaultLogo() {
		handleSvgChange("")
	}

	if (isLoading) {
		return (
			<div className="flex items-center justify-center p-8">
				<LoaderCircleIcon className="h-6 w-6 animate-spin" />
			</div>
		)
	}

	return (
		<div>
			<div>
				<h3 className="text-xl font-medium mb-2 flex items-center gap-2">
					<PaletteIcon className="h-5 w-5" />
					<Trans>Appearance</Trans>
				</h3>
				<p className="text-sm text-muted-foreground leading-relaxed">
					<Trans>Customize the global branding logo and color scheme across the application.</Trans>
				</p>
			</div>

			<Separator className="my-4" />

			<form onSubmit={handleSubmit} className="space-y-6">
				{/* Custom Logo SVG section */}
				<div className="grid gap-3">
					<div>
						<h4 className="text-base font-medium mb-1">
							<Trans>Custom Logo (SVG)</Trans>
						</h4>
						<p className="text-sm text-muted-foreground leading-relaxed">
							<Trans>
								Paste raw SVG code to replace the default Beszel logo in the navbar and login page.
							</Trans>
						</p>
					</div>

					<div className="grid gap-2">
						<div className="flex items-center justify-between">
							<Label htmlFor="customLogo">
								<Trans>Raw SVG Code</Trans>
							</Label>
							{svgInput && (
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="h-7 text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground"
									onClick={handleResetDefaultLogo}
								>
									<RotateCcwIcon className="h-3 w-3" />
									<Trans>Reset to Default Logo</Trans>
								</Button>
							)}
						</div>
						<Textarea
							id="customLogo"
							name="customLogo"
							rows={6}
							className="font-mono text-xs"
							placeholder='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">...</svg>'
							value={svgInput}
							onChange={(e) => handleSvgChange(e.target.value)}
						/>
						{svgError && <p className="text-xs text-destructive mt-1">{svgError}</p>}
					</div>

					{/* SVG Preview Card */}
					{previewSvg && !svgError && (
						<div className="mt-2 p-4 border rounded-md bg-muted/30">
							<div className="flex items-center gap-2 mb-2 text-xs font-medium text-muted-foreground">
								<EyeIcon className="h-3.5 w-3.5" />
								<Trans>Logo Preview</Trans>
							</div>
							<div className="flex items-center gap-6 p-4 bg-card rounded-md border border-border/60">
								<div className="flex items-center h-8">
									<div
										className="h-6 flex items-center max-w-48 [&>svg]:h-full [&>svg]:w-auto [&>svg]:fill-foreground"
										dangerouslySetInnerHTML={{ __html: previewSvg }}
									/>
								</div>
								<span className="text-xs text-muted-foreground">
									<Trans>Preview in header context</Trans>
								</span>
							</div>
						</div>
					)}
				</div>

				<Separator />

				{/* Text Colors */}
				<div className="grid gap-3">
					<div>
						<h4 className="text-base font-medium mb-1">
							<Trans>Default Text Colors</Trans>
						</h4>
						<p className="text-sm text-muted-foreground leading-relaxed">
							<Trans>Customize the global foreground text color for light and dark themes (hex, rgb, hsl, or CSS color value).</Trans>
						</p>
					</div>

					<div className="grid sm:grid-cols-2 gap-4">
						<div className="grid gap-2">
							<Label htmlFor="textColorLight">
								<Trans>Light Mode Text Color</Trans>
							</Label>
							<div className="flex items-center gap-2">
								{textColorLight && (
									<div
										className="h-8 w-8 rounded-md border border-border shrink-0"
										style={{ backgroundColor: textColorLight }}
									/>
								)}
								<Input
									id="textColorLight"
									name="textColorLight"
									placeholder="e.g. #111827 or hsl(30 0% 10%)"
									value={textColorLight}
									onChange={(e) => setTextColorLight(e.target.value)}
								/>
							</div>
						</div>

						<div className="grid gap-2">
							<Label htmlFor="textColorDark">
								<Trans>Dark Mode Text Color</Trans>
							</Label>
							<div className="flex items-center gap-2">
								{textColorDark && (
									<div
										className="h-8 w-8 rounded-md border border-border shrink-0"
										style={{ backgroundColor: textColorDark }}
									/>
								)}
								<Input
									id="textColorDark"
									name="textColorDark"
									placeholder="e.g. #f9fafb or hsl(220 2% 97%)"
									value={textColorDark}
									onChange={(e) => setTextColorDark(e.target.value)}
								/>
							</div>
						</div>
					</div>
				</div>

				<Separator />

				<Button type="submit" className="flex items-center gap-1.5" disabled={isSaving || Boolean(svgError)}>
					{isSaving ? <LoaderCircleIcon className="h-4 w-4 animate-spin" /> : <SaveIcon className="h-4 w-4" />}
					<Trans>Save Appearance</Trans>
				</Button>
			</form>
		</div>
	)
}
