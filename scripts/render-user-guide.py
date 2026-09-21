"""Render the DA VINCI team guide. Run: python scripts/render-user-guide.py"""

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import simpleSplit
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    HRFlowable,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs" / "guia-uso-da-vinci.pdf"
NAVY = colors.HexColor("#0B2035")
INK = colors.HexColor("#172A43")
MUTED = colors.HexColor("#50647A")
CYAN = colors.HexColor("#12AFC3")
LIME = colors.HexColor("#84D700")
PALE = colors.HexColor("#F0F8FA")
LINE = colors.HexColor("#D5E0E9")
ORANGE = colors.HexColor("#965A00")


def font(name, candidates):
    for candidate in candidates:
        if candidate.exists():
            pdfmetrics.registerFont(TTFont(name, str(candidate)))
            return name
    raise FileNotFoundError(f"Falta una fuente para {name}")


FONTS = Path("C:/Windows/Fonts")
DEJAVU = Path("/usr/share/fonts/truetype/dejavu")
REGULAR = font("GuideRegular", [FONTS / "segoeui.ttf", DEJAVU / "DejaVuSans.ttf"])
BOLD = font("GuideBold", [FONTS / "segoeuib.ttf", DEJAVU / "DejaVuSans-Bold.ttf"])
CONDENSED = font("GuideCondensed", [FONTS / "ARIALNB.TTF", DEJAVU / "DejaVuSansCondensed-Bold.ttf"])
pdfmetrics.registerFontFamily(REGULAR, normal=REGULAR, bold=BOLD)

STYLES = {
    "title": ParagraphStyle("GuideTitle", fontName=CONDENSED, fontSize=25, leading=27, textColor=INK, spaceAfter=9),
    "lead": ParagraphStyle("GuideLead", fontName=REGULAR, fontSize=10.2, leading=15.2, textColor=MUTED, spaceAfter=11),
    "h2": ParagraphStyle("GuideH2", fontName=CONDENSED, fontSize=15, leading=18, textColor=INK, spaceBefore=12, spaceAfter=7),
    "body": ParagraphStyle("GuideBody", fontName=REGULAR, fontSize=9.4, leading=14.2, textColor=INK, spaceAfter=7),
    "small": ParagraphStyle("GuideSmall", fontName=REGULAR, fontSize=8.4, leading=12.6, textColor=MUTED, spaceAfter=4),
    "table": ParagraphStyle("GuideTable", fontName=REGULAR, fontSize=8.8, leading=12.8, textColor=INK),
    "label": ParagraphStyle("GuideLabel", fontName=BOLD, fontSize=8.6, leading=12, textColor=INK),
    "number": ParagraphStyle("GuideNumber", fontName=BOLD, fontSize=10, leading=14, textColor=colors.HexColor("#087A8B"), alignment=TA_CENTER),
    "state": ParagraphStyle("GuideState", fontName=BOLD, fontSize=9.4, leading=13, textColor=INK, alignment=TA_CENTER),
    "stateinfo": ParagraphStyle("GuideStateInfo", fontName=REGULAR, fontSize=8.2, leading=11.5, textColor=MUTED, alignment=TA_CENTER),
}


def p(text, style="body"):
    return Paragraph(text, STYLES[style])


def section(title):
    return p(title, "h2")


def bullet(text):
    style = ParagraphStyle("GuideBullet", parent=STYLES["body"], leftIndent=13, firstLineIndent=0, bulletIndent=0, spaceAfter=6)
    return Paragraph(text, style, bulletText="•")


def step(number, title, explanation):
    content = p(f"<b>{title}</b> {explanation}", "body")
    box = Table([[p(f"{number:02d}", "number"), content]], colWidths=[33, 480])
    box.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LINEBELOW", (0, 0), (-1, -1), 0.45, LINE),
        ("LEFTPADDING", (0, 0), (0, 0), 2),
        ("LEFTPADDING", (1, 0), (1, 0), 3),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    return box


def callout(title, text, background=PALE):
    content = p(f"<b>{title}</b><br/>{text}", "small")
    panel = Table([[content]], colWidths=[513])
    panel.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), background),
        ("LINEBEFORE", (0, 0), (0, 0), 3, CYAN),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
    ]))
    return panel


def roles_table():
    rows = [
        [p("ROL", "label"), p("QUÉ HACE", "label")],
        [p("Admin", "label"), p("Planifica, asigna, administra cuentas y consulta Histórico y Papelera.", "table")],
        [p("Operario", "label"), p("Ve sus actividades, inicia trabajo, registra material y entrega.", "table")],
        [p("Aunor", "label"), p("Consulta actividades, Histórico y Contrato. No modifica trabajos.", "table")],
    ]
    table = Table(rows, colWidths=[90, 423], hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PALE),
        ("LINEBELOW", (0, 0), (-1, -1), 0.45, LINE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    return table


def states_table():
    cells = [
        [p("Programada", "state"), p("En proceso", "state"), p("Entregada", "state")],
        [p("Pendiente de iniciar", "stateinfo"), p("Trabajo iniciado", "stateinfo"), p("Material registrado y entrega cerrada", "stateinfo")],
    ]
    table = Table(cells, colWidths=[171, 171, 171])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PALE),
        ("BOX", (0, 0), (-1, -1), 0.5, LINE),
        ("INNERGRID", (0, 0), (-1, -1), 0.4, LINE),
        ("TOPPADDING", (0, 0), (-1, 0), 9),
        ("BOTTOMPADDING", (0, 1), (-1, 1), 10),
    ]))
    return table


def page(canvas, doc):
    width, height = A4
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, height - 78, width, 78, fill=1, stroke=0)
    canvas.setStrokeColor(CYAN)
    canvas.setLineWidth(2.5)
    canvas.line(41, height - 78, width - 41, height - 78)
    canvas.setFont(CONDENSED, 17)
    canvas.setFillColor(colors.white)
    canvas.drawString(41, height - 36, "CONTROL DE ACTIVIDADES")
    canvas.setFont(BOLD, 8)
    canvas.setFillColor(CYAN)
    canvas.drawString(41, height - 53, "DA VINCI")
    canvas.setFillColor(LIME)
    canvas.roundRect(width - 77, height - 44, 36, 5, 2, fill=1, stroke=0)
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    canvas.line(41, 35, width - 41, 35)
    canvas.setFont(REGULAR, 7.7)
    canvas.setFillColor(MUTED)
    canvas.drawString(41, 23, "Guía de uso  |  Setiembre 2026")
    canvas.drawRightString(width - 41, 23, f"Página {doc.page}")
    canvas.restoreState()


def build_story():
    s = []
    # 1. Orientación y acceso.
    s += [p("Guía de uso para el equipo", "title"),
          p("Cuatro páginas para trabajar con datos reales en DA VINCI. Elige tu rol y sigue el recorrido correspondiente.", "lead"),
          callout("Acceso a la plataforma", '<link href="https://rhino-panel.vercel.app/acceso" color="#087A8B">rhino-panel.vercel.app/acceso</link>'),
          section("1. Entrar y orientarse"),
          step(1, "Abre Acceso.", "Selecciona tu cuenta y pulsa <b>Ingresar</b>."),
          step(2, "Escribe usuario y clave.", "Comprueba el nombre de usuario aunque hayas elegido tu cuenta en la lista."),
          step(3, "Si recibiste una clave temporal, cámbiala.", "La pantalla <b>Cambia tu clave temporal</b> pide una nueva clave de 12 a 128 caracteres, con mayúsculas, minúsculas, números y un símbolo. Después vuelve a ingresar."),
          step(4, "Al terminar, pulsa Cerrar sesión.", "En celular, usa la navegación de la parte inferior; en escritorio, el menú lateral."),
          section("2. Qué puede hacer cada cuenta"), roles_table(),
          section("3. Cómo leer los estados"), states_table(),
          Spacer(1, 9),
          p("<b>Importante:</b> guardar un enlace de material no cambia por sí solo el estado. <b>Entregar</b> es una acción distinta que cierra el trabajo.", "small"),
          PageBreak()]

    # 2. Operario.
    s += [p("Operario | De la tarea a la entrega", "title"),
          p("En <b>Mi panel</b> aparecen tus actividades. Filtra por mes o estado, busca el nombre y abre la ficha para trabajar.", "lead"),
          section("Recorrido recomendado"),
          step(1, "Abre la actividad asignada.", "Revisa descripción, fecha, lugar y responsable antes de comenzar."),
          step(2, "Pulsa Iniciar.", "El estado pasa de <b>Programada</b> a <b>En proceso</b>."),
          step(3, "Pulsa Entregar material.", "En <b>Actualizar ejecución</b>, pega el enlace HTTPS del archivo en <b>Enlace del material</b>. Puedes añadir tu <b>Opinión opcional</b> y pulsar <b>Guardar ejecución</b>."),
          step(4, "Pulsa Entregar.", "Hazlo desde la ficha cuando el enlace esté listo. El estado pasa a <b>Entregada</b>; el enlace queda disponible en <b>Abrir material</b>."),
          step(5, "Corrige una entrega si hace falta.", "Una vez guardado el enlace, el botón pasa a llamarse <b>Actualizar entrega</b>. Abre la misma pantalla para cambiar el enlace o la opinión mientras estén habilitados."),
          Spacer(1, 11),
          callout("Dónde guardar el archivo", "Sube fotos o videos al servicio de archivos que utiliza el equipo. En DA VINCI se guarda un enlace HTTPS válido; el archivo no se sube desde esta ficha."),
          section("Conversación y permisos"),
          bullet("Si Admin inicia la <b>Conversación con Admin</b> después de la entrega, puedes responder allí. El cliente Aunor no ve esos mensajes."),
          bullet("El primer mensaje de Admin bloquea la edición del enlace y de la opinión. Si necesitas corregirlos, coordínalo con Admin."),
          bullet("<b>Crear actividad propia</b> aparece solo si Admin te concedió ese permiso. Las actividades asignadas por Admin no permiten cambiar la planificación desde tu cuenta."),
          PageBreak()]

    # 3. Admin.
    s += [p("Admin | Organizar y corregir", "title"),
          p("Admin ve todas las actividades y gestiona planificación, cuentas, Histórico y Papelera.", "lead"),
          section("Planificar y seguir el trabajo"),
          step(1, "Pulsa Planificar actividad.", "Completa tipo, <b>Actividad o proyecto</b>, descripción, lugar, jornadas y Operario responsable. Puedes añadir más jornadas con <b>+ Añadir jornada</b>."),
          step(2, "Pulsa Planificar y asignar.", "La actividad queda <b>Programada</b>. El responsable la ejecuta; Admin puede corregir la planificación con <b>Editar plan</b>."),
          step(3, "Usa Histórico.", "Elige Grabación, Edición o <b>Ver todo el Histórico</b>, selecciona año y fecha; <b>Ver detalles</b> abre una actividad y <b>Volver</b> regresa a la lista del día."),
          section("Cuentas"),
          bullet("En <b>Cuentas &gt; + Usuarios</b> crea una cuenta. Entrega la clave temporal por un canal seguro: solo aparece una vez; el usuario deberá cambiarla."),
          bullet("Desde cada cuenta puedes <b>Editar</b>, <b>Restablecer clave</b>, conceder o retirar <b>creación propia</b>, <b>Desactivar</b> o <b>Reactivar</b>."),
          section("Correcciones y Papelera"),
          bullet("<b>Restablecer a Programada</b> crea una nueva actividad limpia. La ejecución anterior, con su material e historial, pasa a Papelera; comprueba el motivo antes de confirmar."),
          bullet("<b>Dar de baja</b> pide motivo. En <b>Papelera</b>, <b>Restaurar actividad</b> devuelve el registro al trabajo normal; puede pedir un nuevo responsable activo."),
          callout("Eliminación definitiva", "<b>Vaciar papelera</b> y <b>Eliminar</b> una cuenta desactivada muestran el impacto y requieren la contraseña de Admin y confirmación. Borran registros, entregas y mensajes de la plataforma; no borran archivos enlazados ni respaldos externos.", colors.HexColor("#FFF7EC")),
          PageBreak()]

    # 4. Cliente.
    s += [p("Aunor | Consultar el trabajo", "title"),
          p("Aunor usa tres pestañas: <b>Actividades</b>, <b>Histórico</b> y <b>Contrato</b>. Es un acceso de consulta.", "lead"),
          section("Actividades"),
          bullet("Al entrar, <b>Todas las fechas</b> muestra los trabajos en seguimiento. Usa búsqueda y filtros de estado, categoría, mes o año para encontrar una actividad."),
          bullet("Abre una actividad para ver estado, descripción, jornadas, lugares y el enlace al material cuando esté disponible."),
          bullet("Una actividad <b>Entregada</b> permanece en este panel durante <b>72 horas</b> desde la entrega. Después se consulta en Histórico; no desaparece del archivo."),
          section("Histórico"),
          bullet("Elige Grabación, Edición o <b>Ver todo el Histórico</b>. Selecciona año y día para ver las actividades de esa fecha."),
          bullet("Si hay varias, pulsa <b>Ver detalles</b> en la que te interese y usa <b>Volver</b> para regresar a la lista. Si hoy no hay trabajo, verás el aviso correspondiente."),
          section("Contrato"),
          bullet("Consulta los servicios previstos, trabajos relacionados, entregas, acuerdos y sustituciones documentadas."),
          bullet("Aunor no cambia estados ni confirma entregas. Para pedir correcciones o aclaraciones, comunícate con Admin."),
          Spacer(1, 9),
          callout("Para todos", "Si no ves una actividad, revisa el mes, año y filtros activos. Si el acceso o un enlace falla, avisa a Admin indicando el nombre de la actividad y el problema; no compartas tu contraseña. Evita escribir nombres de Operarios o notas internas en títulos y descripciones visibles para Aunor."),
          Spacer(1, 15),
          HRFlowable(width="100%", thickness=0.7, color=LINE),
          Spacer(1, 11),
          p("<b>En una frase:</b> Admin organiza; el Operario ejecuta y entrega; Aunor consulta el avance y el resultado.", "body")]
    return s


def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    document = SimpleDocTemplate(
        str(OUTPUT), pagesize=A4,
        leftMargin=41, rightMargin=41, topMargin=99, bottomMargin=52,
        title="DA VINCI - Guía de uso para el equipo",
        author="DA VINCI",
        subject="Acceso, Operario, Admin y Aunor",
    )
    document.build(build_story(), onFirstPage=page, onLaterPages=page)
    print(OUTPUT)


if __name__ == "__main__":
    main()
