import zipfile
import xml.etree.ElementTree as ET
import sys
import io

def extract_text_from_docx(file_path):
    try:
        with zipfile.ZipFile(file_path) as docx:
            xml_content = docx.read('word/document.xml')
            tree = ET.fromstring(xml_content)
            # Find all text elements
            ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            texts = []
            for node in tree.iter():
                if node.tag == f"{{{ns['w']}}}t" and node.text:
                    texts.append(node.text)
                elif node.tag == f"{{{ns['w']}}}p":
                    texts.append('\n')
            return ''.join(texts)
    except Exception as e:
        return str(e)

if __name__ == '__main__':
    # Force UTF-8 encoding for standard output
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    print(extract_text_from_docx(sys.argv[1]))
