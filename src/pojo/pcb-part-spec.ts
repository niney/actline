export type PcbPartSpec = {
	attribute: PcbPartAttribute;
	display_value: string;
}

export type PcbPartAttribute = {
	group: string;
	name: string;
	shortname: string;
}
