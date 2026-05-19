#!/usr/bin/env python3
"""One-off: append 主圖 sections to design-history pages that have no image."""
from pathlib import Path

BASE = Path(r"D:\design-history-website\content")

# (relative path, caption, image_url_or_local)
ENTRIES = [
    # 流派 (包浩斯 already has 主圖 from prior edit)
    ("40-流派/中國書法傳統.md", "王獻之 行書摹本（唐代）",
     "https://upload.wikimedia.org/wikipedia/commons/6/69/Wang_Xianzhi_Imitation_by_Tang_Dynasty.jpg"),
    ("40-流派/伊斯蘭幾何設計.md", "馬拉喀什 Ben Youssef 神學院門廊幾何裝飾",
     "https://upload.wikimedia.org/wikipedia/commons/e/e1/Doorway_in_Ben_Youssef_Madrasa.JPG"),
    ("40-流派/古希臘古典.md", "雅典帕德嫩神殿",
     "https://upload.wikimedia.org/wikipedia/commons/d/da/The_Parthenon_in_Athens.jpg"),
    ("40-流派/哥德式建築.md", "英國 Wells 大教堂西立面",
     "https://upload.wikimedia.org/wikipedia/commons/f/ff/Wells_Cathedral_West_Front_Exterior%2C_UK_-_Diliff.jpg"),
    ("40-流派/國際樣式.md", "Lovell House，洛杉磯（Richard Neutra, 1929）",
     "https://upload.wikimedia.org/wikipedia/commons/4/4d/Lovell_House%2C_Los_Angeles%2C_California.JPG"),
    ("40-流派/孟菲斯設計.md", "Memphis-Milano 設計群作品",
     "https://upload.wikimedia.org/wikipedia/commons/4/48/Memphis-Milano_Movement.jpg"),
    ("40-流派/工藝美術運動.md", "William Morris《Trellis》壁紙設計，1862",
     "https://upload.wikimedia.org/wikipedia/commons/b/b4/William_Morris_design_for_Trellis_wallpaper_1862.jpg"),
    ("40-流派/巴洛克.md", "羅馬 Sant'Ignazio 教堂內部濕壁畫",
     "https://upload.wikimedia.org/wikipedia/commons/e/ed/Lazio_Roma_SIgnazio_tango7174.jpg"),
    ("40-流派/文藝復興建築.md", "Bramante 設計的 Tempietto，羅馬",
     "https://upload.wikimedia.org/wikipedia/commons/7/71/Tempietto_di_Bramante02783.jpg"),
    ("40-流派/新藝術運動.md", "Tassel House 樓梯間（Victor Horta, 布魯塞爾 1893）",
     "https://upload.wikimedia.org/wikipedia/commons/a/af/Tassel_House_stairway.JPG"),
    ("40-流派/日本民藝運動.md", "濱田庄司製茶碗",
     "https://upload.wikimedia.org/wikipedia/commons/3/30/Thrown%2C_Combed_tea_bowl_by_Shoji_Hamada_%28YORYM-2004.1.1957%29_%28cropped%29.JPG"),
    ("40-流派/普普藝術.md", "Eduardo Paolozzi《I was a Rich Man's Plaything》, 1947",
     "https://upload.wikimedia.org/wikipedia/en/d/d0/I_was_a_Rich_Man%27s_Plaything_1947.jpg"),
    ("40-流派/構成主義.md", "El Lissitzky《用紅楔擊白》, 1919",
     "https://upload.wikimedia.org/wikipedia/commons/f/fd/Klinom_Krasnym_Bej_Belych.JPG"),
    ("40-流派/浮世繪.md", "奧村政信《芝居浮繪》",
     "https://upload.wikimedia.org/wikipedia/commons/a/a9/Shibai_Ukie_by_Masanobu_Okumura.jpg"),
    ("40-流派/瑞士國際主義.md", "Müller-Brockmann 設計，Gewerbemuseum Basel 展覽海報, 1959",
     "https://upload.wikimedia.org/wikipedia/commons/8/87/1959_-_Gewerbemuseum_Basel_-_Alte_und_neue_Formen_in_Japan.jpg"),
    ("40-流派/維也納分離派.md", "維也納分離派會館（Olbrich, 1898）",
     "https://upload.wikimedia.org/wikipedia/commons/c/cb/Secession_2016%2C_Vienna.jpg"),
    ("40-流派/裝飾藝術.md", "克萊斯勒大廈 — 紐約裝飾藝術代表作",
     "https://upload.wikimedia.org/wikipedia/commons/9/9b/Chrysler_Building_1_%284684845155%29.jpg"),
    ("40-流派/解構主義.md", "Walt Disney Concert Hall（法蘭克·蓋瑞, 洛杉磯）",
     "https://upload.wikimedia.org/wikipedia/commons/c/cf/Image-Disney_Concert_Hall_by_Carol_Highsmith_edit-2.jpg"),
    ("40-流派/達達主義.md", "柏林第一屆達達展覽開幕,1920 年 6 月",
     "https://upload.wikimedia.org/wikipedia/commons/3/3f/Grand_opening_of_the_first_Dada_exhibition%2C_Berlin%2C_5_June_1920.jpg"),
    ("40-流派/風格派.md", "Theo van Doesburg《Composition VII》",
     "https://upload.wikimedia.org/wikipedia/commons/4/4f/Theo_van_Doesburg_Composition_VII_%28the_three_graces%29.jpg"),

    # 時代
    ("10-時代/中世紀設計.md", "蒙雷阿萊主教座堂的拜占庭式金底馬賽克（西西里, 12 世紀）",
     "https://upload.wikimedia.org/wikipedia/commons/1/14/Monreale_BW_2012-10-09_09-52-40.jpg"),
    ("10-時代/古代設計.md", "Pella 出土的獅子狩獵馬賽克（古希臘）",
     "https://upload.wikimedia.org/wikipedia/commons/3/3d/Lion_hunt_mosaic_from_Pella.jpg"),
    ("10-時代/工業革命與設計.md", "1835 年動力紡織機織造場景",
     "https://upload.wikimedia.org/wikipedia/commons/d/dc/Powerloom_weaving_in_1835.jpg"),
    ("10-時代/後現代主義.md", "Vanna Venturi House（Robert Venturi, 1964）— 後現代建築的開山宣言",
     "https://upload.wikimedia.org/wikipedia/commons/2/29/V_Venturi_H_720am.JPG"),
    ("10-時代/文藝復興設計.md", "義大利文藝復興圖像集錦",
     "https://upload.wikimedia.org/wikipedia/commons/0/05/Italian_Renaissance_montage.png"),
    ("10-時代/現代主義.md", "薩伏伊別墅 — 柯比意現代主義建築的典範",
     "https://upload.wikimedia.org/wikipedia/en/3/3c/VillaSavoye.jpg"),
    ("10-時代/當代設計.md", "Walt Disney Concert Hall — 當代建築代表作",
     "https://upload.wikimedia.org/wikipedia/commons/8/8c/Walt_Disney_Concert_Hall%2C_LA%2C_CA%2C_jjron_22.03.2012.jpg"),

    # 地區
    ("20-地區/印度設計史.md", "埃洛拉石窟 Kailasanatha 神殿（750-775）",
     "https://upload.wikimedia.org/wikipedia/commons/7/70/Ellora%2C_tempio_kailasanatha_%28grotta_16%29%2C_750-775_dc_ca.%2C_tempio_di_shiva_visto_dalla_terrazza_del_gopuram%2C_lato_dx_%28sud%29_01.jpg"),
    ("20-地區/東亞設計史.md", "京都南禪寺大殿",
     "https://upload.wikimedia.org/wikipedia/commons/9/97/%E5%8D%97%E7%A6%85%E5%AF%BA%E5%A4%A7%E6%AE%BF%E6%AD%A3%E9%9D%A2.jpg"),
    ("20-地區/歐洲設計史.md", "Thomas Cole《建築師之夢》, 1840",
     "https://upload.wikimedia.org/wikipedia/commons/6/6c/Thomas_Cole_-_Architect%E2%80%99s_Dream_-_Google_Art_Project.jpg"),
    ("20-地區/美洲設計史.md", "帝國大廈 — 紐約現代摩天樓的標誌",
     "https://upload.wikimedia.org/wikipedia/commons/1/10/Empire_State_Building_%28aerial_view%29.jpg"),
    ("20-地區/其他地區設計史.md", "非洲大陸",
     "https://upload.wikimedia.org/wikipedia/commons/8/86/Africa_%28orthographic_projection%29.svg"),

    # 領域
    ("30-領域/UI-UX設計史.md", "圖形使用者介面範例",
     "https://upload.wikimedia.org/wikipedia/commons/7/77/Example_of_a_GUI.png"),
    ("30-領域/字體設計史.md", "Trajan 字體範本(取自圖拉真柱碑文)",
     "https://upload.wikimedia.org/wikipedia/commons/e/e4/Trajan_typeface_specimen.svg"),
    ("30-領域/家具設計史.md", "古典側椅組(MET 典藏)",
     "https://upload.wikimedia.org/wikipedia/commons/c/c6/Set_of_fourteen_side_chairs_MET_DP110780.jpg"),
    ("30-領域/工業設計史.md", "Olivetti MC 24 打字機(Marcello Nizzoli 設計)",
     "https://upload.wikimedia.org/wikipedia/commons/e/ec/Olivetti-mc24-marcello-nizzoli.jpg"),
    ("30-領域/平面設計史.md", "平面設計作品集錦",
     "https://upload.wikimedia.org/wikipedia/commons/5/51/Graphic-designer-application-projects-collage-2.0.jpg"),
    ("30-領域/建築史.md", "佛羅倫斯聖母百花大教堂",
     "https://upload.wikimedia.org/wikipedia/commons/1/1b/View_of_Santa_Maria_del_Fiore_in_Florence.jpg"),

    # 作品(缺圖)
    ("60-作品/1964東京奧運海報.md", "1964 東京奧運會徽(龜倉雄策設計)",
     "https://upload.wikimedia.org/wikipedia/commons/1/13/Tokyo_1964_Summer_Olympics_logo.svg"),
    ("60-作品/落水山莊.md", "落水山莊全景", "LOCAL:99-素材/images/作品/落水山莊.jpg"),

    # 理論
    ("70-理論/包浩斯宣言.md", "華特·葛羅培斯,1919 — 包浩斯創校時的肖像",
     "https://upload.wikimedia.org/wikipedia/commons/b/b5/WalterGropius-1919.jpg"),
]

# Special case: 光之教堂 has a broken local image reference. Replace it.
KONOTEKKYO = BASE / "60-作品" / "光之教堂.md"
KONO_URL = "https://upload.wikimedia.org/wikipedia/commons/4/4b/Ibaraki_Kasugaoka_Church_light_cross.jpg"

def append_image_section(file_path: Path, caption: str, url: str):
    """Append a 主圖 section to the end of the file."""
    if not file_path.exists():
        print(f"MISSING: {file_path}")
        return
    text = file_path.read_text(encoding="utf-8")
    if "## 主圖" in text:
        print(f"SKIP (already has 主圖): {file_path.name}")
        return
    if url.startswith("LOCAL:"):
        local = url[6:]
        embed = f"![[{local}]]"
    else:
        embed = f"![{caption}]({url})"
    section = f"\n## 主圖\n{embed}\n"
    new_text = text.rstrip() + "\n" + section
    file_path.write_text(new_text, encoding="utf-8")
    print(f"OK: {file_path.name}")

def fix_konotekkyo():
    text = KONOTEKKYO.read_text(encoding="utf-8")
    old = "![[99-素材/images/作品/光之教堂.jpg]]"
    new = f"![安藤忠雄 光之教堂,大阪茨木 1989]({KONO_URL})"
    if old in text:
        KONOTEKKYO.write_text(text.replace(old, new), encoding="utf-8")
        print(f"FIXED broken image ref: 光之教堂.md")
    else:
        print(f"光之教堂.md: old ref not found, no change")

for rel, caption, url in ENTRIES:
    append_image_section(BASE / rel, caption, url)

fix_konotekkyo()

print("Done.")
