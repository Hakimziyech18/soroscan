import { render, screen } from "@testing-library/react"
import { Spinner } from "@/components/ui/spinner"

describe("Spinner Component", () => {
  it("renders with default properties", () => {
    render(<Spinner />)
    const spinner = screen.getByRole("status")
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveClass("text-primary")
    expect(spinner).toHaveClass("size-6")
  })

  it("renders all color variants", () => {
    const variants = ["success", "warning", "error"] as const
    variants.forEach((v) => {
      const { unmount } = render(<Spinner variant={v} />)
      const spinner = screen.getByRole("status")
      expect(spinner).toBeInTheDocument()
      unmount()
    })
  })

  it("renders all size variants", () => {
    const sizes = ["mini", "large"] as const
    sizes.forEach((s) => {
      const { unmount } = render(<Spinner size={s} />)
      const spinner = screen.getByRole("status")
      expect(spinner).toBeInTheDocument()
      unmount()
    })
  })

  it("supports custom size classes", () => {
    render(<Spinner className="size-20" />)
    const spinner = screen.getByRole("status")
    // Tailwind-merge (cn utility) will overwrite the default size-6 with size-20
    expect(spinner).toHaveClass("size-20")
  })
})