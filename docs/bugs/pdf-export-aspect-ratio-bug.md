# Bug Report: PDF Export Aspect Ratio Not Preserved

**Bug ID**: BUG-001
**Severity**: Medium
**Priority**: High
**Reported Date**: 2025-01-17
**Status**: In Progress
**Branch**: `bugfix/pdf-export-aspect-ratio`

---

## Summary

When exporting a diagram to PDF format, the aspect ratio displayed in the browser preview is not preserved. The exported PDF uses a fixed A4 format regardless of the diagram's actual dimensions, resulting in stretched or compressed content that doesn't match what the user sees in the preview.

---

## Current Behavior (❌ Incorrect)

1. User generates a diagram and sees it rendered correctly in the iframe preview
2. User clicks "Export to PDF" button
3. PDF is generated with A4 format (8.27" × 11.69" or 210mm × 297mm)
4. Diagram content is forced into A4 dimensions, distorting the aspect ratio
5. **Result**: PDF does not match the preview appearance

### Example Scenario

- **Preview Viewport**: 1920px × 1080px (16:9 aspect ratio - widescreen)
- **PDF Output**: A4 portrait (210mm × 297mm, ~8.27" × 11.69")
- **Problem**: 16:9 content squeezed into ~1:1.41 aspect ratio

---

## Expected Behavior (✅ Correct)

1. User generates a diagram and sees it rendered correctly in the iframe preview
2. User clicks "Export to PDF" button
3. PDF is generated matching the actual content dimensions
4. Aspect ratio from preview is preserved exactly
5. **Result**: PDF looks identical to what user sees in preview

### Example Expected Outcome

- **Preview Viewport**: 1920px × 1080px (16:9 aspect ratio)
- **PDF Output**: Custom size matching 16:9 aspect ratio
- **Result**: Perfect match between preview and export

---

## Root Cause Analysis

### File: `lib/export/html-to-pdf.ts`

**Line 67**: `preferCSSPageSize: false`
- Forces PDF to use specified format (A4) instead of content dimensions
- Ignores the natural size of the HTML content

**Lines 54-68**: PDF generation settings
```typescript
const pdf = await page.pdf({
  format: options.format || 'A4',  // ❌ Hardcoded A4 format
  width: options.width,
  height: options.height,
  printBackground: options.printBackground !== false,
  scale: options.scale || 1,
  margin: { ... },
  landscape: options.landscape || false,
  preferCSSPageSize: false,  // ❌ Ignores content dimensions
});
```

### File: `app/api/diagram/export/route.ts`

**Lines 171-189**: `exportToPDF` function
```typescript
async function exportToPDF(html: string): Promise<Buffer> {
  const buffer = await htmlToPdf(html, {
    format: 'A4',  // ❌ Hardcoded A4 without viewport detection
    printBackground: true,
    scale: 1,
    margin: { ... },
  });
  return buffer;
}
```

### Comparison with PNG Export (✅ Working Correctly)

**File**: `lib/export/html-to-png.ts` (Lines 98-102)

```typescript
const screenshot = await page.screenshot({
  type: 'png',
  fullPage: true,  // ✅ Captures actual content dimensions
});
```

PNG export correctly uses `fullPage: true` to capture the natural dimensions of the content.

---

## Proposed Solution

### Approach: Dynamic Viewport-Based PDF Generation

1. **Detect actual content dimensions** before generating PDF
2. **Calculate appropriate PDF page size** matching content aspect ratio
3. **Use `preferCSSPageSize: true`** or custom width/height
4. **Maintain consistency** with PNG export behavior

### Implementation Plan

#### Step 1: Enhance `html-to-pdf.ts`

Add function to calculate content dimensions:

```typescript
/**
 * Calculate optimal PDF dimensions from HTML content
 * Renders content, measures actual size, returns dimensions
 */
async function getContentDimensions(
  page: Page,
  html: string
): Promise<{ width: number; height: number }> {
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const dimensions = await page.evaluate(() => {
    const body = document.body;
    const html = document.documentElement;

    const width = Math.max(
      body.scrollWidth,
      body.offsetWidth,
      html.clientWidth,
      html.scrollWidth,
      html.offsetWidth
    );

    const height = Math.max(
      body.scrollHeight,
      body.offsetHeight,
      html.clientHeight,
      html.scrollHeight,
      html.offsetHeight
    );

    return { width, height };
  });

  return dimensions;
}
```

#### Step 2: Modify `htmlToPdf` function

Add `preserveAspectRatio` option:

```typescript
export interface PdfExportOptions {
  format?: 'A4' | 'Letter' | 'Legal';
  width?: string;
  height?: string;
  printBackground?: boolean;
  scale?: number;
  margin?: { ... };
  landscape?: boolean;
  preserveAspectRatio?: boolean;  // NEW OPTION
}
```

Update PDF generation logic:

```typescript
export async function htmlToPdf(
  html: string,
  options: PdfExportOptions = {}
): Promise<Buffer> {
  const { chromium } = await import('playwright-core');

  let browser;
  try {
    browser = await chromium.launch({ ... });
    const page = await browser.newPage();

    // NEW: If preserveAspectRatio, calculate actual dimensions
    let pdfOptions: any = {
      printBackground: options.printBackground !== false,
      scale: options.scale || 1,
      margin: options.margin || { ... },
    };

    if (options.preserveAspectRatio) {
      // Calculate content dimensions
      const dimensions = await getContentDimensions(page, html);

      // Convert pixels to inches (96 DPI standard)
      const widthInches = dimensions.width / 96;
      const heightInches = dimensions.height / 96;

      pdfOptions.width = `${widthInches}in`;
      pdfOptions.height = `${heightInches}in`;
      pdfOptions.preferCSSPageSize = false;
    } else {
      // Use traditional format-based export
      pdfOptions.format = options.format || 'A4';
      pdfOptions.width = options.width;
      pdfOptions.height = options.height;
      pdfOptions.landscape = options.landscape || false;
      pdfOptions.preferCSSPageSize = false;
    }

    // Set content again before PDF generation
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const pdf = await page.pdf(pdfOptions);

    return Buffer.from(pdf);
  } catch (error) {
    throw new Error(`PDF generation failed: ${error.message}`);
  } finally {
    if (browser) await browser.close();
  }
}
```

#### Step 3: Update Export API

Modify `app/api/diagram/export/route.ts`:

```typescript
async function exportToPDF(html: string): Promise<Buffer> {
  const buffer = await htmlToPdf(html, {
    preserveAspectRatio: true,  // ✅ Enable aspect ratio preservation
    printBackground: true,
    scale: 1,
    margin: {
      top: '0.4in',
      right: '0.4in',
      bottom: '0.4in',
      left: '0.4in',
    },
  });

  return buffer;
}
```

---

## Acceptance Criteria

### ✅ Success Criteria

1. **Aspect Ratio Match**: PDF export preserves exact aspect ratio from preview
2. **Visual Consistency**: Exported PDF looks identical to browser preview
3. **Various Dimensions**: Works correctly for:
   - Widescreen diagrams (16:9, 16:10)
   - Portrait diagrams (9:16, 3:4)
   - Square diagrams (1:1)
   - Ultra-wide diagrams (21:9)
4. **No Distortion**: Content not stretched, squeezed, or cropped
5. **Backward Compatibility**: Existing PDF exports continue to work
6. **File Size**: PDF file size remains within acceptable limits (<10MB per constraint)
7. **Performance**: PDF generation time <10 seconds for typical diagrams

### 🧪 Test Cases

1. **Test Wide Diagram**
   - Generate 1920×1080 diagram (16:9)
   - Export to PDF
   - Verify PDF dimensions match 16:9 ratio

2. **Test Tall Diagram**
   - Generate 1080×1920 diagram (9:16)
   - Export to PDF
   - Verify PDF dimensions match 9:16 ratio

3. **Test Square Diagram**
   - Generate 1200×1200 diagram (1:1)
   - Export to PDF
   - Verify PDF dimensions match 1:1 ratio

4. **Test Complex Diagram with Charts**
   - Generate diagram with Chart.js elements
   - Verify charts render correctly in PDF
   - Verify aspect ratio preserved

5. **Test Large Diagram**
   - Generate 3840×2160 diagram (4K, 16:9)
   - Export to PDF
   - Verify PDF size within limits
   - Verify aspect ratio preserved

### ⚠️ Edge Cases

- Very small diagrams (<500px)
- Very large diagrams (>4K resolution)
- Diagrams with dynamic content
- Diagrams with external images
- Diagrams using custom fonts

---

## Testing Strategy

1. **Manual Testing**: Test all acceptance criteria scenarios
2. **Visual Comparison**: Compare preview vs PDF side-by-side
3. **Automated Testing**: Unit tests for dimension calculation
4. **Regression Testing**: Ensure existing exports still work

---

## Implementation Timeline

- **Bug Documentation**: Complete ✅
- **Design & Planning**: 30 minutes
- **Implementation**: 1-2 hours
- **Testing**: 30 minutes
- **Total Estimated Time**: 2-3 hours

---

## Related Files

- `lib/export/html-to-pdf.ts` (Primary fix location)
- `app/api/diagram/export/route.ts` (API endpoint update)
- `lib/export/html-to-png.ts` (Reference for correct behavior)
- `components/diagram/DiagramPreview.tsx` (Preview implementation)

---

## References

- Playwright Page.pdf() documentation
- PNG export implementation (working correctly)
- STATUS.md Phase 5 export functionality notes
- Git workflow guide for bugfix process

---

**Last Updated**: 2025-01-17
**Assigned To**: Claude Code Agent
**Expected Completion**: 2025-01-17
