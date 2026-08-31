"""
Lumino AI Playwright Crawler Test
Server already running at http://localhost:3000
"""
import os
import json
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:3000"
SCREENSHOT_DIR = r"C:\Users\Test\Desktop\claude\Lumino.ai\__screenshots"

PAGES = [
    {"path": "/login", "expect_redirect": False},
    {"path": "/register", "expect_redirect": False},
    {"path": "/dashboard", "expect_redirect": True},
    {"path": "/interview/new", "expect_redirect": True},
    {"path": "/history", "expect_redirect": True},
]

results = []

def check_styled(page):
    """Check if the page has CSS applied (not plain HTML)."""
    # Check for non-default background color or gradient
    body_bg = page.evaluate("""() => {
        const body = document.body;
        const style = window.getComputedStyle(body);
        return style.backgroundColor;
    }""")

    # Check if there are any stylesheets loaded
    stylesheet_count = page.evaluate("""() => document.styleSheets.length""")

    # Check for gradient in any element
    has_gradient = page.evaluate("""() => {
        const allEls = document.querySelectorAll('*');
        for (let el of allEls) {
            const style = window.getComputedStyle(el);
            if (style.background && style.background.includes('gradient')) return true;
            if (style.backgroundImage && style.backgroundImage.includes('gradient')) return true;
        }
        return false;
    }""")

    return {
        "body_bg": body_bg,
        "stylesheet_count": stylesheet_count,
        "has_gradient": has_gradient,
        "is_styled": stylesheet_count > 0 and body_bg != "rgba(0, 0, 0, 0)"
    }

def check_font(page):
    """Check if custom font is loaded."""
    font_family = page.evaluate("""() => {
        const body = document.body;
        const style = window.getComputedStyle(body);
        return style.fontFamily;
    }""")
    return font_family

def check_inputs(page):
    """Check for email input and submit button."""
    has_email = page.locator('input[type="email"]').count() > 0
    has_submit = (
        page.locator('button[type="submit"]').count() > 0 or
        page.locator('button:has-text("Sign")').count() > 0 or
        page.locator('button:has-text("Log")').count() > 0 or
        page.locator('button:has-text("Register")').count() > 0 or
        page.locator('button:has-text("Create")').count() > 0
    )
    return has_email, has_submit

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(
        viewport={"width": 1280, "height": 800}
    )

    js_errors = []

    for page_info in PAGES:
        path = page_info["path"]
        expect_redirect = page_info["expect_redirect"]
        page_name = path.strip("/").replace("/", "_") or "root"

        page = context.new_page()

        # Collect JS errors
        page_errors = []
        page.on("pageerror", lambda err: page_errors.append(str(err)))

        url = BASE_URL + path
        result = {"path": path, "url": url, "errors": []}

        try:
            response = page.goto(url, wait_until="networkidle", timeout=45000)

            final_url = page.url
            status = response.status if response else None

            result["status"] = status
            result["final_url"] = final_url
            result["redirected_to_login"] = "/login" in final_url and path != "/login"

            # Check load state
            title = page.title()
            result["title"] = title

            # Check not blank
            body_text = page.locator("body").inner_text()
            result["not_blank"] = len(body_text.strip()) > 50

            # Check styling
            style_info = check_styled(page)
            result["styled"] = style_info

            # Check font
            result["font"] = check_font(page)

            # For login/register: check inputs
            if path in ["/login", "/register"]:
                has_email, has_submit = check_inputs(page)
                result["has_email_input"] = has_email
                result["has_submit_button"] = has_submit

            # Take screenshot
            screenshot_path = os.path.join(SCREENSHOT_DIR, f"{page_name}.png")
            page.screenshot(path=screenshot_path, full_page=True)
            result["screenshot"] = screenshot_path
            result["ok"] = True

        except Exception as e:
            result["ok"] = False
            result["error"] = str(e)

        result["js_errors"] = page_errors
        results.append(result)
        page.close()

    browser.close()

# Print report
print("\n" + "="*60)
print("LUMINO AI PLAYWRIGHT CRAWLER REPORT")
print("="*60)

for r in results:
    print(f"\nPATH: {r['path']}")
    if r.get("ok"):
        print(f"  Status:       {r.get('status', 'N/A')}")
        print(f"  Final URL:    {r.get('final_url', '')}")
        print(f"  Title:        {r.get('title', '')}")
        print(f"  Not blank:    {r.get('not_blank', False)}")

        styled = r.get("styled", {})
        print(f"  Stylesheets:  {styled.get('stylesheet_count', 0)}")
        print(f"  Body BG:      {styled.get('body_bg', 'N/A')}")
        print(f"  Has gradient: {styled.get('has_gradient', False)}")
        print(f"  Is styled:    {styled.get('is_styled', False)}")
        print(f"  Font:         {r.get('font', 'N/A')[:60]}")

        if "has_email_input" in r:
            print(f"  Email input:  {r['has_email_input']}")
            print(f"  Submit btn:   {r['has_submit_button']}")

        if r.get("redirected_to_login"):
            print(f"  [OK] Redirected to /login as expected")

        print(f"  Screenshot:   {r.get('screenshot', 'N/A')}")
    else:
        print(f"  ERROR: {r.get('error', 'Unknown error')}")

    if r.get("js_errors"):
        print(f"  JS ERRORS: {r['js_errors']}")
    else:
        print(f"  JS errors:    None")

print("\n" + "="*60)
print("SUMMARY")
print("="*60)
ok_pages = [r['path'] for r in results if r.get('ok')]
styled_pages = [r['path'] for r in results if r.get('styled', {}).get('is_styled')]
error_pages = [r['path'] for r in results if not r.get('ok')]
pages_with_js_errors = [r['path'] for r in results if r.get('js_errors')]

print(f"Loaded OK:     {ok_pages}")
print(f"Styled:        {styled_pages}")
print(f"Load errors:   {error_pages if error_pages else 'None'}")
print(f"JS errors on:  {pages_with_js_errors if pages_with_js_errors else 'None'}")
