import { test, expect } from "@playwright/test";
async function signIn(page) {
  await page.goto("/login");
  await page.getByLabel("Email or student roll").fill("B101");
  await page.getByLabel("Password").fill("BrowserStudentPassword123!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Welcome,/ })).toBeVisible();
}
async function ask(page, question) {
  await page.getByLabel("Message the student assistant").fill(question);
  await page.getByRole("button", { name: "Send message", exact: true }).click();
}
test("assistant explains ragging and explicitly hands off to the correct complaint category", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await signIn(page);
  await page
    .getByRole("button", { name: "Open student assistant", exact: true })
    .click();
  const chat = page.getByRole("dialog", { name: "PUST assistant" });
  await ask(page, "I was ragged by seniors. How do I report this?");
  await expect(chat.getByText(/Hide my identity from reviewers/)).toBeVisible();
  await expect(page).toHaveURL("http://127.0.0.1:5011/");
  await chat
    .getByRole("button", { name: "Open ragging complaint", exact: true })
    .click();
  await expect(page).toHaveURL(/\/complaint\?category=ragging$/);
  await expect(page.getByLabel("Category")).toHaveValue("ragging");
  await expect(page.getByLabel("Describe what happened")).toHaveValue("");
  await page.getByLabel("Category").selectOption("academic");
  await page
    .getByLabel("Describe what happened")
    .fill("An unsubmitted draft that must be preserved.");
  await page
    .getByRole("button", { name: "Open student assistant", exact: true })
    .click();
  await ask(page, "How do I report harassment?");
  await chat
    .getByRole("button", { name: "Open harassment complaint", exact: true })
    .click();
  await expect(page.getByLabel("Category")).toHaveValue("harassment");
  await expect(page.getByLabel("Describe what happened")).toHaveValue(
    "An unsubmitted draft that must be preserved.",
  );
  await page
    .getByRole("button", { name: "Open student assistant", exact: true })
    .click();
  await expect(
    chat.getByText("How do I report harassment?", { exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Open student assistant", exact: true }),
  ).toBeFocused();
  expect(errors).toEqual([]);
});
test("guest reporting guidance carries the requested destination through sign-in", async ({
  page,
}) => {
  await page.goto("/login");
  await page
    .getByRole("button", { name: "Continue as guest", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Open student assistant", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Report ragging", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Sign in as a student to report",
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(/\/login\?next=/);
  await page.getByLabel("Email or student roll").fill("B101");
  await page.getByLabel("Password").fill("BrowserStudentPassword123!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Submit a complaint", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Category")).toHaveValue("ragging");
});
test("mobile chat fits the viewport, handles failure, and clears its in-memory conversation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page);
  await page
    .getByRole("button", { name: "Open student assistant", exact: true })
    .click();
  const chat = page.getByRole("dialog", { name: "PUST assistant" }),
    box = await chat.boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(390);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(844);
  await page.route("**/api/assistant/chat", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ message: "Chat is temporarily unavailable." }),
    }),
  );
  await ask(page, "A private unsent study question");
  await expect(chat.getByRole("alert")).toContainText(
    "Chat is temporarily unavailable.",
  );
  await expect(page.getByLabel("Message the student assistant")).toHaveValue(
    "A private unsent study question",
  );
  await page.unroute("**/api/assistant/chat");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(
    chat.getByText("A private unsent study question", { exact: true }),
  ).toBeVisible();
  const persisted = await page.evaluate(() =>
    Object.values(localStorage).some((value) =>
      value.includes("A private unsent study question"),
    ),
  );
  expect(persisted).toBe(false);
  await page
    .getByRole("button", { name: "Start a new chat", exact: true })
    .click();
  await expect(
    chat.getByText("A private unsent study question", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Report ragging", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath("student-assistant-mobile.png"),
  });
});
