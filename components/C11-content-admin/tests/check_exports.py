from pathlib import Path
import json,sys
from lxml import etree
from jsonschema import Draft202012Validator
r=Path(sys.argv[1]);xsd=etree.XMLSchema(etree.parse(str(r/'schema.xsd')));doc=etree.parse(str(r/'portal.xml'));xsd.assertValid(doc)
root=doc.getroot();value={'schemaVersion':int(root.attrib['schemaVersion']),**{n.tag:json.loads(n.text) for n in root}}
schema=json.loads((r/'schema.json').read_text());Draft202012Validator.check_schema(schema);Draft202012Validator(schema).validate(value)
assert len(value['content']['faq'])==4 and 'опыт' in value['content']['letterTemplates']['de']['body']
out={'passed':True,'xml_well_formed':True,'xsd_valid':True,'json_schema_valid':True,'unicode_preserved':True,'faq_count':len(value['content']['faq'])};(r.parent/'export-validation.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out))
