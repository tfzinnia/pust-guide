import { test, expect } from "@playwright/test";
import fs from "node:fs";
const snapshot = JSON.parse(
  fs.readFileSync(
    new URL("../../server/data/pust-directory.json", import.meta.url),
    "utf8",
  ),
);
const registrar = snapshot.offices.find(
  (office) => office.source_key === "office:registrar-office",
);
const registrarHead = registrar.people.find((person) => person.is_head);
async function guest(page) {
  await page.goto("/login");
  await page
    .getByRole("button", { name: "Continue as guest", exact: true })
    .click();
}
test("public administration directory exposes published officials and their source links", async ({
  page,
}) => {
  await page.goto("/administration");
  await expect(
    page.getByRole("heading", { name: "People who keep PUST running" }),
  ).toBeVisible();
  await page.getByLabel("Search offices", { exact: true }).fill("Registrar");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Registrar Office", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "View office & people →", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: registrarHead.name, exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Official source", exact: true }).first(),
  ).toHaveAttribute("href", registrar.source_url);
  await expect(
    page.getByText("Checked 17 Nov 2026", { exact: true }).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "People", exact: true }).click();
  await page.getByLabel("Role type").selectOption("faculty");
  await expect(page.getByText("212 published role listings")).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("Page 2", { exact: true })).toBeVisible();
});
test("all official departments, faculty details, and published contacts are visible on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await guest(page);
  await page.goto("/departments");
  await expect(page.locator('main a[href^="/departments/"]')).toHaveCount(21);
  await expect(
    page.getByLabel("Filter by faculty").locator("option"),
  ).toHaveCount(6);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const cse = snapshot.departments.find(
    (department) => department.official_short_name === "CSE",
  );
  await page.getByRole("link", { name: new RegExp(cse.name) }).click();
  await expect(
    page.getByRole("heading", {
      name: cse.faculty_members[0].name,
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.locator('a[href="mailto:cse@pust.ac.bd"]').first(),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Official profile/ }).first(),
  ).toHaveAttribute("href", /^https:\/\/pust\.ac\.bd\//);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("search and assistant answers use the new published directory", async ({
  page,
}) => {
  await guest(page);
  await page.goto("/search?q=registrar");
  await page.getByRole("link", { name: /^Registrar Office/ }).click();
  await expect(
    page.getByRole("heading", { name: registrarHead.name, exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Open student assistant", exact: true })
    .click();
  await page
    .getByLabel("Message the student assistant")
    .fill("Who is the registrar?");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  const chat = page.getByRole("dialog", { name: "PUST assistant" });
  await expect(chat.locator("div.whitespace-pre-wrap").last()).toContainText(
    registrarHead.name,
  );
  await chat
    .getByRole("button", { name: "Open administration & people", exact: true })
    .click();
  await expect(page).toHaveURL(/\/administration$/);
  await page.screenshot({
    path: test.info().outputPath("pust-administration-directory.png"),
    fullPage: true,
  });
});
