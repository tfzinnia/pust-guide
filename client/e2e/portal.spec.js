import { test, expect } from "@playwright/test";
async function login(page, role = "student") {
  await page.goto("/login");
  if (role === "admin")
    await page.getByRole("button", { name: "Admin", exact: true }).click();
  await page
    .getByLabel(role === "admin" ? "Admin email" : "Email or student roll")
    .fill(role === "admin" ? "browser-admin@example.test" : "B101");
  await page
    .getByLabel("Password")
    .fill(
      role === "admin"
        ? "BrowserAdminPassword123!"
        : "BrowserStudentPassword123!",
    );
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name:
        role === "admin"
          ? "University administration"
          : "Welcome, Browser Student.",
    }),
  ).toBeVisible();
}
test("student dashboard, search, bookmarks, notification counts, and map", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await login(page);
  await expect(
    page.getByRole("heading", { name: "Introduction to computing" }),
  ).toBeVisible();
  await page.getByLabel("Search campus information").fill("library");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(
    page.getByRole("link", { name: /Campus library/ }),
  ).toBeVisible();
  await page.getByRole("link", { name: /Campus library/ }).click();
  await expect(page.locator("iframe")).toHaveAttribute(
    "src",
    /openstreetmap.org\/export\/embed/,
  );
  await expect(
    page.getByRole("link", { name: "Directions", exact: true }),
  ).toHaveAttribute("href", /destination=24.01343,89.2791/);
  await page.goto("/notices");
  await page
    .getByRole("button", { name: "Save bookmark", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Remove bookmark", exact: true }),
  ).toBeVisible();
  await page.goto("/saved");
  await expect(
    page.getByRole("heading", { name: "Campus welcome" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Campus welcome" }),
  ).toBeVisible();
  await page.goto("/notifications");
  await page.getByRole("button", { name: "Mark all as read" }).click();
  await expect(page.getByText("0 unread updates")).toBeVisible();
  expect(errors).toEqual([]);
});
test("management editing saves changes through the real API", async ({
  page,
}) => {
  await login(page, "admin");
  await page.goto("/admin/manage/notices");
  await page.getByRole("button", { name: "Edit Campus welcome" }).click();
  await page
    .getByLabel("Description")
    .fill("Edited through the management interface.");
  await page.getByRole("button", { name: "Save record", exact: true }).click();
  await expect(page.getByText("Record saved.")).toBeVisible();
  await expect(
    page.getByText("Edited through the management interface."),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Edited through the management interface."),
  ).toBeVisible();
});
test("anonymous report, staff review, and conversation work end to end", async ({
  page,
  browser,
}) => {
  await login(page);
  await page.goto("/complaint");
  await page
    .getByLabel("Describe what happened")
    .fill("A private anonymous report from browser testing.");
  await page.getByLabel("Hide my identity from reviewers").check();
  await page
    .getByRole("button", { name: "Submit complaint", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: /Complaint #\d+/ }),
  ).toBeVisible();
  const complaintPath = new URL(page.url()).pathname;
  await page
    .getByLabel("Add a reply")
    .fill("Additional context from the student.");
  await page.getByRole("button", { name: "Send reply" }).click();
  await expect(
    page.getByText("Additional context from the student.", { exact: true }),
  ).toBeVisible();
  const staffContext = await browser.newContext({
      baseURL: "http://127.0.0.1:5011",
    }),
    staff = await staffContext.newPage();
  await login(staff, "admin");
  await staff.goto(complaintPath);
  await expect(staff.getByText("Browser Student", { exact: true })).toHaveCount(
    0,
  );
  await staff.getByLabel("Status").selectOption("under_review");
  await staff
    .getByLabel("Update for the student")
    .fill("We are reviewing this report.");
  await staff.getByRole("button", { name: "Save review" }).click();
  await expect(
    staff.getByText("We are reviewing this report.", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("We are reviewing this report.", { exact: true }),
  ).toBeVisible();
  await staffContext.close();
});
test("mobile layout and offline app shell keep a viewed schedule available", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  await page.goto("/departments/1?tab=Class");
  // The fixture department ID is discovered from the student's home link.
  if (
    !(await page
      .getByRole("heading", { name: "Introduction to computing" })
      .count())
  ) {
    await page.goto("/");
    await page
      .getByRole("link", { name: "Departments", exact: true })
      .first()
      .click();
    await page.getByRole("tab", { name: "Class", exact: true }).click();
  }
  await expect(
    page.getByRole("heading", { name: "Introduction to computing" }),
  ).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  const protocol = await context.newCDPSession(page);
  const installability = await protocol.send("Page.getInstallabilityErrors");
  await protocol.detach();
  // Playwright isolates tests in incognito contexts, where installation itself is disabled.
  expect(
    installability.installabilityErrors.filter(
      (error) => error.errorId !== "in-incognito",
    ),
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText(/You’re offline/)).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Introduction to computing" }),
  ).toBeVisible();
  await expect(page.getByText(/Offline copy saved/).first()).toBeVisible();
  await context.setOffline(false);
});

test("syllabus upload and offline PDF download work through the portal", async ({
  page,
  browser,
}) => {
  await login(page, "admin");
  await page.goto("/admin/manage/syllabus");
  await page.getByRole("button", { name: "Add record", exact: true }).click();
  const departments = await (await page.request.get("/api/departments")).json();
  const department = departments.find((row) => row.short_name === "CSE");
  await page
    .getByLabel("Department", { exact: false })
    .selectOption(String(department.id));
  await page.getByLabel("Session").selectOption("2026-2027");
  await page.getByLabel("Year", { exact: false }).selectOption("1st Year");
  await page.getByLabel("Semester").selectOption("1st Semester");
  await page.getByLabel("Course code").fill("BROWSER101");
  await page.getByLabel("Course title").fill("Browser syllabus");
  await page.getByLabel("Syllabus PDF").setInputFiles({
    name: "browser-syllabus.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.7\nBrowser syllabus document"),
  });
  await expect(page.getByText("Attachment ready")).toBeVisible();
  await page.getByRole("button", { name: "Save record", exact: true }).click();
  await expect(page.getByText("Record saved.")).toBeVisible();
  const context = await browser.newContext({
      baseURL: "http://127.0.0.1:5011",
    }),
    studentPage = await context.newPage();
  await login(studentPage);
  await studentPage.goto(`/departments/${department.id}?tab=Syllabus`);
  await expect(
    studentPage.getByRole("heading", { name: "Browser syllabus" }),
  ).toBeVisible();
  const first = studentPage.waitForEvent("download");
  await studentPage
    .getByRole("link", { name: "Download", exact: true })
    .click();
  await expect((await first).suggestedFilename()).toBe("syllabus.pdf");
  await expect(
    studentPage.getByText("Available offline on this device"),
  ).toBeVisible();
  await studentPage.evaluate(() => navigator.serviceWorker.ready);
  await expect
    .poll(() =>
      studentPage.evaluate(() => !!navigator.serviceWorker.controller),
    )
    .toBe(true);
  await context.setOffline(true);
  await studentPage.reload();
  await expect(
    studentPage.getByRole("heading", { name: "Browser syllabus" }),
  ).toBeVisible();
  const offline = studentPage.waitForEvent("download");
  await studentPage
    .getByRole("link", { name: "Download", exact: true })
    .click();
  expect((await offline).suggestedFilename()).toBe("syllabus.pdf");
  await context.close();
});

test("profile editing and approved academic requests update the actual student account", async ({
  page,
  browser,
}) => {
  await login(page);
  await page.goto("/settings");
  await page.getByLabel("Full name").fill("Updated Browser Student");
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(
    page.getByText("Profile updated", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Full name")).toHaveValue(
    "Updated Browser Student",
  );
  await page.getByLabel("Year", { exact: false }).selectOption("2nd Year");
  await page
    .getByRole("button", { name: "Request academic change", exact: true })
    .click();
  await expect(
    page.getByText(
      "Academic change requested. An administrator will review it.",
    ),
  ).toBeVisible();
  const context = await browser.newContext({
      baseURL: "http://127.0.0.1:5011",
    }),
    adminPage = await context.newPage();
  await login(adminPage, "admin");
  await adminPage.goto("/admin/manage/requests");
  await adminPage.getByRole("button", { name: "Approve", exact: true }).click();
  await expect(
    adminPage.getByText("Request approved.", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Refresh current profile", exact: true })
    .click();
  await expect(
    page.getByText(/Current: 2026-2027 · 2nd Year · 1st Semester/),
  ).toBeVisible();
  await page.goto("/search?q=BROWSER101");
  await page.getByRole("link", { name: /BROWSER101/ }).click();
  await expect(
    page.getByRole("heading", { name: "Browser syllabus" }),
  ).toBeVisible();
  await context.close();
});
