import re, os
D = os.path.dirname(os.path.abspath(__file__)); I = os.environ.get("ICONS", os.path.expanduser("~/sites/_icons"))
L = {"CURSO":"https://kiwify.app/3fMlAHY","DM":"https://ig.me/m/andreavieiradacunha_","IG":"https://www.instagram.com/andreavieiradacunha_/",
     "L1":"https://hotmart.com/pt-br/marketplace/produtos/caminho-para-a-cura-um-guia-pratico-para-superar-feridas-e-viver-em-paz/E101189234R",
     "L2":"https://go.hotmart.com/Y105969079E","L3":"https://go.hotmart.com/M102919479B",
     "L4":"https://hotmart.com/pt-br/marketplace/produtos/hagsxd-andrea-da-silva-vieira-kzukd/N106135722O",
     "L5":"https://hotmart.com/pt-br/marketplace/produtos/audiobook-comununicacao/Y107456335S"}
reels = [("Df22nX9imU5","Por trás de cada propósito existe uma história"),("DaxzY-XiFtm","Novidades no curso Mulheres Curadas"),
         ("Da84HmKCoT_","Lançamento do Caminho para a Cura na FEFICC 2026"),("DfVZo2OC-IJ","A cura dos pais transforma a história dos filhos"),
         ("DfiSnlKCsKE","Você está com medo do futuro?"),("DfDWvAViAZL","A consciência que cura"),
         ("DfQPgQLChc2","Saúde emocional"),("DfSvhcoCBw8","Você quer encontrar respostas?")]
src = open(f"{D}/_src.html").read()
def icon(m):
    n = m.group(1); s = open(f"{I}/{n}.svg").read()
    s = re.sub(r"<!--.*?-->", "", s, flags=re.S).strip()
    head, rest = s.split(">", 1)
    s = re.sub(r'\s(class|width|height)="[^"]*"', "", head) + ">" + rest
    s = s.replace("<svg", '<svg class="ico" aria-hidden="true"', 1)
    return re.sub(r"\s*\n\s*", " ", s)
rh = "\n    ".join(f'<a class="reel up" style="--d:{i*0.06:.2f}s" href="https://www.instagram.com/reel/{c}/" target="_blank" rel="noopener"><img src="img/ig-{c}.jpg" alt="{t}" loading="lazy"></a>' for i,(c,t) in enumerate(reels))
src = src.replace("{{REELS}}", rh)
for k,v in L.items(): src = src.replace("{{"+k+"}}", v)
src = re.sub(r"\{\{i:([a-z0-9-]+)\}\}", icon, src)
assert "{{" not in src, re.findall(r"\{\{[^}]+\}\}", src)
open(f"{D}/index.html.new","w").write(src); print("ok", len(src))
