"""Generate the NutriMedAI user manual PDF."""

from pathlib import Path

from reportlab.lib.colors import Color, HexColor, white
from reportlab.lib.enums import TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    HRFlowable,
    CondPageBreak,
    KeepTogether,
    ListFlowable,
    ListItem,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

FONT_DIR = Path(r"C:\Windows\Fonts")
pdfmetrics.registerFont(TTFont("Segoe", str(FONT_DIR / "segoeui.ttf")))
pdfmetrics.registerFont(TTFont("Segoe-Bold", str(FONT_DIR / "segoeuib.ttf")))
pdfmetrics.registerFont(TTFont("Segoe-Light", str(FONT_DIR / "segoeuil.ttf")))
pdfmetrics.registerFont(TTFont("Segoe-Semibold", str(FONT_DIR / "segoeuisl.ttf")))

INK = HexColor("#1E1B4B")
MUTED = HexColor("#5B5675")
VIOLET = HexColor("#5B21B6")
VIOLET_DEEP = HexColor("#4C1D95")
LAVENDER = HexColor("#F5F3FF")
LINE = HexColor("#DDD6FE")
SOFT = HexColor("#EDE9FE")
CARD = HexColor("#FAF8FF")

PAGE_W, PAGE_H = A4
LEFT = 18 * mm
RIGHT = 18 * mm
TOP = 22 * mm
BOTTOM = 18 * mm


def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(VIOLET)
    canvas.rect(0, PAGE_H - 8 * mm, PAGE_W, 8 * mm, fill=1, stroke=0)
    canvas.setFillColor(white)
    canvas.setFont("Segoe", 8)
    canvas.drawString(LEFT, PAGE_H - 5.2 * mm, "NutriMedAI")
    canvas.drawRightString(PAGE_W - RIGHT, PAGE_H - 5.2 * mm, "User Manual")

    canvas.setFillColor(LAVENDER)
    canvas.rect(0, 0, PAGE_W, 12 * mm, fill=1, stroke=0)
    canvas.setFillColor(VIOLET)
    canvas.rect(0, 12 * mm, PAGE_W, 0.4 * mm, fill=1, stroke=0)
    canvas.setFillColor(MUTED)
    canvas.setFont("Segoe", 8)
    canvas.drawString(LEFT, 5 * mm, "nutri-medi-ai.vercel.app")
    canvas.drawRightString(PAGE_W - RIGHT, 5 * mm, f"{doc.page}")
    canvas.restoreState()


def cover_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(LAVENDER)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    canvas.setFillColor(VIOLET)
    canvas.rect(0, 0, 10 * mm, PAGE_H, fill=1, stroke=0)
    canvas.setFillColor(VIOLET_DEEP)
    canvas.rect(0, 0, PAGE_W, 28 * mm, fill=1, stroke=0)
    canvas.setFillColor(white)
    canvas.setFont("Segoe", 8.5)
    canvas.drawString(LEFT, 12 * mm, "Version 1.0   ·   September 2026")
    canvas.restoreState()


def styles():
    s = {}
    s["kicker"] = ParagraphStyle(
        "kicker",
        fontName="Segoe-Semibold",
        fontSize=9,
        leading=12,
        textColor=VIOLET,
        tracking=1.2,
        spaceAfter=2 * mm,
    )
    s["h1"] = ParagraphStyle(
        "h1",
        fontName="Segoe-Bold",
        fontSize=18,
        leading=22,
        textColor=INK,
        spaceBefore=1 * mm,
        spaceAfter=3 * mm,
    )
    s["h2"] = ParagraphStyle(
        "h2",
        fontName="Segoe-Bold",
        fontSize=12.5,
        leading=16,
        textColor=VIOLET_DEEP,
        spaceBefore=5 * mm,
        spaceAfter=2 * mm,
    )
    s["body"] = ParagraphStyle(
        "body",
        fontName="Segoe",
        fontSize=10.5,
        leading=15.5,
        textColor=INK,
        alignment=TA_JUSTIFY,
        spaceAfter=2.4 * mm,
    )
    s["body_left"] = ParagraphStyle(
        "body_left",
        parent=s["body"],
        alignment=TA_LEFT,
    )
    s["small"] = ParagraphStyle(
        "small",
        fontName="Segoe",
        fontSize=9,
        leading=13,
        textColor=MUTED,
        spaceAfter=1.5 * mm,
    )
    s["step_title"] = ParagraphStyle(
        "step_title",
        fontName="Segoe-Semibold",
        fontSize=10.5,
        leading=14,
        textColor=INK,
        spaceAfter=0.6 * mm,
    )
    s["step_body"] = ParagraphStyle(
        "step_body",
        fontName="Segoe",
        fontSize=9.5,
        leading=13.2,
        textColor=HexColor("#3F3A5A"),
    )
    s["toc_item"] = ParagraphStyle(
        "toc_item",
        fontName="Segoe",
        fontSize=11,
        leading=18,
        textColor=INK,
    )
    s["cover_kicker"] = ParagraphStyle(
        "cover_kicker",
        fontName="Segoe-Semibold",
        fontSize=10,
        leading=14,
        textColor=VIOLET,
        spaceAfter=4 * mm,
    )
    s["cover_title"] = ParagraphStyle(
        "cover_title",
        fontName="Segoe-Bold",
        fontSize=36,
        leading=40,
        textColor=INK,
        spaceAfter=2 * mm,
    )
    s["cover_sub"] = ParagraphStyle(
        "cover_sub",
        fontName="Segoe-Light",
        fontSize=16,
        leading=22,
        textColor=VIOLET_DEEP,
        spaceAfter=8 * mm,
    )
    s["label"] = ParagraphStyle(
        "label",
        fontName="Segoe-Semibold",
        fontSize=8,
        leading=10,
        textColor=VIOLET,
    )
    s["value"] = ParagraphStyle(
        "value",
        fontName="Segoe",
        fontSize=10.5,
        leading=14,
        textColor=INK,
    )
    s["note"] = ParagraphStyle(
        "note",
        fontName="Segoe",
        fontSize=9.5,
        leading=13.4,
        textColor=INK,
    )
    s["bullet"] = ParagraphStyle(
        "bullet",
        fontName="Segoe",
        fontSize=10.5,
        leading=14.5,
        textColor=INK,
        leftIndent=2 * mm,
    )
    return s


S = styles()


def rule():
    return HRFlowable(width="100%", thickness=0.4, color=LINE, spaceBefore=1 * mm, spaceAfter=3 * mm)


def section_title(number, title):
    return KeepTogether(
        [
            CondPageBreak(48 * mm),
            Paragraph(f"SECTION  {number}", S["kicker"]),
            Paragraph(title, S["h1"]),
            rule(),
        ]
    )


def subhead(title):
    return KeepTogether([CondPageBreak(24 * mm), Paragraph(title, S["h2"])])


def para(text, style="body"):
    return Paragraph(text, S[style])


def bullets(items):
    flow = []
    for item in items:
        flow.append(ListItem(Paragraph(item, S["bullet"]), leftIndent=8 * mm, bulletColor=VIOLET))
    return ListFlowable(
        flow,
        bulletType="bullet",
        start="•",
        bulletFontName="Segoe",
        bulletFontSize=10,
        leftIndent=6 * mm,
        spaceBefore=1 * mm,
        spaceAfter=2 * mm,
    )


def callout(title, body):
    inner = [
        Paragraph(title.upper(), S["label"]),
        Spacer(1, 1.2 * mm),
        Paragraph(body, S["note"]),
    ]
    data = [[inner]]
    table = Table(data, colWidths=[PAGE_W - LEFT - RIGHT])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), SOFT),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("LINEBEFORE", (0, 0), (0, -1), 3, VIOLET),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    return KeepTogether([Spacer(1, 1.5 * mm), table, Spacer(1, 3 * mm)])


def step(number, title, body):
    num = Paragraph(str(number), ParagraphStyle("num", fontName="Segoe-Bold", fontSize=12, leading=14, textColor=white, alignment=1))
    badge = Table([[num]], colWidths=[8 * mm], rowHeights=[8 * mm])
    badge.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), VIOLET),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 1),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
    text = [Paragraph(title, S["step_title"]), Paragraph(body, S["step_body"])]
    row = Table([[badge, text]], colWidths=[12 * mm, PAGE_W - LEFT - RIGHT - 12 * mm])
    row.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (0, 0), 0),
                ("RIGHTPADDING", (0, 0), (0, 0), 0),
                ("LEFTPADDING", (1, 0), (1, 0), 3),
                ("RIGHTPADDING", (1, 0), (1, 0), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 1),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("BACKGROUND", (0, 0), (-1, -1), white),
            ]
        )
    )
    return row


def info_table(rows):
    data = []
    for label, value in rows:
        data.append(
            [
                Paragraph(label, S["label"]),
                Paragraph(value, S["value"]),
            ]
        )
    table = Table(data, colWidths=[42 * mm, PAGE_W - LEFT - RIGHT - 42 * mm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), CARD),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LINEBELOW", (0, 0), (-1, -2), 0.3, LINE),
                ("BOX", (0, 0), (-1, -1), 0.4, LINE),
            ]
        )
    )
    return table


def result_row(name, meaning):
    return [
        Paragraph(name, ParagraphStyle("rn", fontName="Segoe-Semibold", fontSize=9.5, leading=12.5, textColor=INK)),
        Paragraph(meaning, ParagraphStyle("rm", fontName="Segoe", fontSize=9.5, leading=12.8, textColor=HexColor("#3F3A5A"))),
    ]


def results_table(pairs):
    header = [
        Paragraph("ON SCREEN", S["label"]),
        Paragraph("WHAT IT MEANS", S["label"]),
    ]
    data = [header] + [result_row(a, b) for a, b in pairs]
    table = Table(data, colWidths=[48 * mm, PAGE_W - LEFT - RIGHT - 48 * mm], repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), SOFT),
                ("BACKGROUND", (0, 1), (-1, -1), white),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("LINEBELOW", (0, 0), (-1, -2), 0.3, LINE),
                ("BOX", (0, 0), (-1, -1), 0.4, LINE),
            ]
        )
    )
    return table


def build():
    out = Path(__file__).resolve().parent / "NutriMedAI-User-Manual.pdf"
    doc = BaseDocTemplate(
        str(out),
        pagesize=A4,
        title="NutriMedAI User Manual",
        author="NutriMedAI",
        subject="How to use NutriMedAI",
    )
    cover_frame = Frame(LEFT, 36 * mm, PAGE_W - LEFT - RIGHT, PAGE_H - 58 * mm, id="cover", showBoundary=0)
    body_frame = Frame(LEFT, BOTTOM, PAGE_W - LEFT - RIGHT, PAGE_H - TOP - BOTTOM, id="body", showBoundary=0)
    doc.addPageTemplates(
        [
            PageTemplate(id="cover", frames=[cover_frame], onPage=cover_page),
            PageTemplate(id="body", frames=[body_frame], onPage=header_footer),
        ]
    )

    story = []

    story.append(Spacer(1, 28 * mm))
    story.append(Paragraph("USER MANUAL", S["cover_kicker"]))
    story.append(Paragraph("NutriMedAI", S["cover_title"]))
    story.append(Paragraph("Personalized nutrition guidance<br/>from a photograph of your meal.", S["cover_sub"]))
    story.append(
        info_table(
            [
                ("Website", "https://nutri-medi-ai.vercel.app"),
                ("Document", "User manual for people using the live application"),
                ("Audience", "Patients, caregivers, and wellness users"),
            ]
        )
    )
    story.append(Spacer(1, 8 * mm))
    story.append(
        para(
            "This guide explains how to sign in, set a health profile, analyze a meal, and read the result. It is written for everyday use. It does not cover installation or system administration.",
            "small",
        )
    )

    story.append(NextPageTemplate("body"))
    story.append(PageBreak())

    story.append(section_title("01", "About this guide"))
    story.append(
        para(
            "NutriMedAI looks at a photo of food and explains how that meal fits the health conditions you choose. The result includes a nutrition score, estimated nutrients, short advice for your conditions, and safer alternatives."
        )
    )
    story.append(para("Use this manual when you want to:"))
    story.append(
        bullets(
            [
                "Open the application and sign in.",
                "Tell the app which conditions should shape the advice.",
                "Upload a meal and understand each part of the result.",
                "Save a report or return to an earlier analysis.",
            ]
        )
    )
    story.append(subhead("Contents"))
    for item in [
        "01   About this guide",
        "02   What NutriMedAI does",
        "03   Before you begin",
        "04   Sign in",
        "05   Set your medical profile",
        "06   Analyze a meal",
        "07   Read your results",
        "08   History, tour, and PDF reports",
        "09   Practical tips",
        "10   If something does not work",
    ]:
        story.append(Paragraph(item, S["toc_item"]))
    story.append(Spacer(1, 3 * mm))

    story.append(section_title("02", "What NutriMedAI does"))
    story.append(
        para(
            "The application is a web dashboard. You do not install anything. After you sign in, you describe your health context, upload a food image, and receive a written analysis tailored to that context."
        )
    )
    story.append(subhead("Each analysis can include"))
    story.append(
        bullets(
            [
                "<b>Identified food.</b> The dish name recognized from the photograph.",
                "<b>Nutrition score.</b> A score from 0 to 100 for how the meal fits the profile you set.",
                "<b>Key metrics.</b> Estimates such as calories, protein, carbohydrates, fat, fiber, sugar, and sodium.",
                "<b>Condition advice.</b> Separate notes for a current condition and for a condition you want to monitor.",
                "<b>Ingredient takeaways.</b> A short TL;DR for the main ingredients.",
                "<b>Similar but safer.</b> Practical swaps or adjustments.",
            ]
        )
    )
    story.append(
        callout(
            "Important",
            "NutriMedAI provides general dietary guidance. It is not a diagnosis, a prescription, or a substitute for advice from a physician or a registered dietitian. When a result conflicts with your care plan, follow your clinician.",
        )
    )

    story.append(section_title("03", "Before you begin"))
    story.append(para("You need three things:"))
    story.append(
        bullets(
            [
                "A current web browser on a phone or computer.",
                "The website address below.",
                "The email and password issued for your account.",
            ]
        )
    )
    story.append(Spacer(1, 1 * mm))
    story.append(
        info_table(
            [
                ("Open this address", "https://nutri-medi-ai.vercel.app"),
                ("Email", "nutriai@admin.com"),
                ("Password", "nutriai@admin"),
            ]
        )
    )
    story.append(Spacer(1, 3 * mm))
    story.append(
        callout(
            "First visit",
            "If the site has been idle, the first page can take 30 to 60 seconds to respond. Wait for the page to finish loading, then sign in. Later visits in the same session are faster.",
        )
    )
    story.append(
        para(
            "This is a shared demonstration account. Analyses saved on it are visible to anyone who signs in with the same details. Do not upload images you would not want associated with a shared login."
        )
    )

    story.append(section_title("04", "Sign in"))
    story.append(step(1, "Open the website", "Go to https://nutri-medi-ai.vercel.app. The home page introduces the product."))
    story.append(step(2, "Choose Login", "Select Login in the top corner. Get Started opens the same sign-in screen. Public self-registration is not available on this deployment."))
    story.append(step(3, "Enter your details", "Type the email and password, then select Log in. A successful sign-in opens the dashboard."))
    story.append(step(4, "Leave when you are finished", "Select Log out in the top bar. This is especially important on a shared computer."))
    story.append(Spacer(1, 2 * mm))
    story.append(
        para(
            "If the message says the email or password is invalid, re-enter both values carefully. The password is case-sensitive. If the message says login failed, the service may still be waking up. Wait a moment and try again."
        )
    )

    story.append(section_title("05", "Set your medical profile"))
    story.append(
        para(
            "The profile is what makes the advice personal. Set it before you upload a photo. You can change it for every new analysis."
        )
    )
    story.append(
        KeepTogether(
            [
                CondPageBreak(42 * mm),
                Paragraph("Current medical condition", S["h2"]),
                para(
                    "This is a condition you already have. Search the list or type your own. You may select more than one. Examples include diabetes, hypertension, heart disease, kidney disease, high cholesterol, celiac disease, lactose intolerance, acid reflux, thyroid disorder, and weight management. If none apply, you can leave the field unused."
                ),
            ]
        )
    )
    story.append(
        KeepTogether(
            [
                CondPageBreak(36 * mm),
                Paragraph("Conditions to monitor", S["h2"]),
                para(
                    "This is a concern you want the meal checked against, even if it is not a current diagnosis. Heart health and blood sugar are typical examples. Advice for this field appears under Concerned condition, separate from the current-condition advice."
                ),
            ]
        )
    )
    story.append(
        callout(
            "How the two fields differ",
            "Current medical condition shapes advice for a condition you are already managing. Conditions to monitor shapes advice for a risk you want to watch. Use both when you need the meal reviewed from two angles.",
        )
    )

    story.append(section_title("06", "Analyze a meal"))
    story.append(step(1, "Start from a clear screen", "If a previous result is still open, select New analysis. The profile and upload form return."))
    story.append(step(2, "Confirm the profile", "Check both condition fields. Add a custom condition if it is not in the list."))
    story.append(step(3, "Upload the food image", "Select the upload area and choose a photo. Accepted formats are PNG, JPG, JPEG, GIF, and WEBP. A preview appears after the file is chosen."))
    story.append(step(4, "Add a note if it helps", "The description is optional. Use it for portion size, cooking method, or a specific question, such as “one bowl, pan-fried, is the rice portion high for diabetes?”"))
    story.append(step(5, "Select Analyze food", "The button stays inactive until an image is attached. A short progress screen appears while the meal is reviewed."))
    story.append(Spacer(1, 2 * mm))
    story.append(
        para(
            "A useful photograph shows the full plate in even light, without heavy filters. Include sides and drinks if they are part of the meal. If several dishes are in the frame, say which one you want reviewed in the description."
        )
    )

    story.append(section_title("07", "Read your results"))
    story.append(
        para(
            "The result opens in two areas. On the left is the identified dish, the photo, and the nutrition score. On the right is the written summary and the condition-specific advice."
        )
    )
    story.append(Spacer(1, 2 * mm))
    story.append(
        results_table(
            [
                ("Identified food", "The name the application assigns to the dish. If it looks wrong, run a new analysis with a clearer photo or a short description."),
                ("Nutrition score", "A 0–100 reading of how the meal fits the profile on this analysis. It is a guide, not a clinical grade."),
                ("Nutrition summary", "A short paragraph describing the meal in plain language."),
                ("Key metrics", "Estimated calories and nutrients. Treat the numbers as estimates from a photograph, not as a laboratory assay."),
                ("Current condition", "Advice written for the conditions you listed as current, including a short TL;DR and labeled points."),
                ("Concerned condition", "The same style of advice for the conditions you asked the app to monitor."),
                ("Similar but safer", "Swaps or portion changes that would suit the profile better."),
                ("Additional note", "An extra remark when the analysis has one more point worth keeping."),
            ]
        )
    )
    story.append(Spacer(1, 3 * mm))
    story.append(subhead("Advice labels"))
    story.append(
        para(
            "Condition cards use short labels so you can scan them. Important marks a point to take seriously. Reasoning explains why. Action is something you can change. Benefit notes what works in your favor. Ask your doctor flags a decision that should go back to your clinician."
        )
    )
    story.append(
        callout(
            "Estimates, not measurements",
            "A photograph cannot weigh a serving. Sauces, oil, and hidden ingredients are easy to miss. Use the metrics as a starting point, and correct them with the description field when you know the portion.",
        )
    )

    story.append(section_title("08", "History, tour, and PDF reports"))
    story.append(subhead("Recent history"))
    story.append(
        para(
            "On a computer, recent analyses stay in the left column. On a phone, open them from the clock icon beside the logo. Search by dish or condition, then select an entry to open it again. Sync history refreshes the list from the account."
        )
    )
    story.append(subhead("Take a tour"))
    story.append(
        para(
            "Take a tour, in the top bar, walks through the profile, the upload area, and history. You can close it at any step. It is a good first pass if someone else is using the account for the first time."
        )
    )
    story.append(subhead("Download PDF"))
    story.append(
        para(
            "When a result is open, Download PDF appears in the top bar. The file is a report of that analysis, including the food image and the condition summary. Use it to keep a copy or to discuss the meal with a clinician. The download button is available only while a result is on screen."
        )
    )

    story.append(section_title("09", "Practical tips"))
    story.append(
        bullets(
            [
                "Set the profile before every analysis if your question has changed. The saved history keeps the conditions used at the time.",
                "One plate per photo gives a cleaner identification than a crowded table.",
                "Name the portion when you know it. “Two rotis and a small bowl of dal” is more useful than a photo alone.",
                "Review Current condition and Concerned condition separately. They answer different questions.",
                "Download the PDF before you start a new analysis if you want a file of the current result.",
                "Sign out on a shared device when you finish.",
            ]
        )
    )

    story.append(section_title("10", "If something does not work"))
    story.append(
        results_table(
            [
                ("The site will not open", "Wait up to a minute and refresh. The service pauses after inactivity and needs a moment to start."),
                ("Login failed", "The application could not reach the sign-in service. Wait, refresh, and try once more."),
                ("Invalid email or password", "Check the email and password in Section 03. The password is case-sensitive."),
                ("Analyze food stays disabled", "An image has not been attached yet. Choose a file and wait for the preview."),
                ("The dish name is wrong", "Upload a closer photo or name the dish in the description, then analyze again."),
                ("The result looks incomplete", "Run the analysis again. A weak connection can interrupt the response."),
                ("No Download PDF button", "Open a completed result first. The button is hidden on the empty upload screen."),
            ]
        )
    )
    story.append(Spacer(1, 4 * mm))
    story.append(
        callout(
            "Medical notice",
            "Do not change medication, insulin, or a prescribed diet because of a score in this application. NutriMedAI supports everyday food decisions. Clinical decisions belong with your care team.",
        )
    )
    story.append(Spacer(1, 6 * mm))
    story.append(rule())
    story.append(
        Paragraph(
            "NutriMedAI  ·  User Manual  ·  Version 1.0  ·  September 2026",
            ParagraphStyle("end", fontName="Segoe", fontSize=8.5, leading=12, textColor=MUTED, alignment=TA_LEFT),
        )
    )

    doc.build(story)
    print(out)


if __name__ == "__main__":
    build()
