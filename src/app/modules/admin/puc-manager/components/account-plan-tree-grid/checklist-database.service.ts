import { Injectable } from "@angular/core";
import { Structure } from "@core/models/data/accountPlan";
import { BehaviorSubject, map } from 'rxjs';
import { FoodNode } from "./matTree";

@Injectable()
export class ChecklistDatabase {

    public dataChange: BehaviorSubject<FoodNode[]> = new BehaviorSubject<FoodNode[]>([]);
    public accountPlanInfo!: Structure;
    public accountPlanData!: FoodNode[];
    public initData!: FoodNode[];

    get data(): FoodNode[] { return this.dataChange.value; }

    constructor(
        
    ) {}

    insertChildren(data: any[], level: number, ancestorsIndex: number[] = []){
        if(level == 0){//inserta SUBTIPO
            const index0 = ancestorsIndex[0];
            (this.initData as any)[index0].children = data;
        }
        else if(level == 1){//inserta CUENTA
            const index0 = ancestorsIndex[0];
            const index1 = ancestorsIndex[1];
            (this.initData as any)[index0].children[index1].children = data;
        }
        else if(level == 2){//inserta SUBCUENTA
            const index0 = ancestorsIndex[0];
            const index1 = ancestorsIndex[1];
            const index2 = ancestorsIndex[2];
            (this.initData as any)[index0].children[index1].children[index2].children =  data;
        }
        this.dataChange.next(this.initData);
    }

    insertItem(child: FoodNode, level: number, ancestorsIndex: number[] = []) {
        if(level == 0){//SUBTIPO
            const index0 = ancestorsIndex[0];
            if(!(this.initData as any)[index0].children) (this.initData as any)[index0].children = [];
            (this.initData as any)[index0].children.push(child);
            (this.initData as any)[index0].children.sort((a: any, b: any) => (parseInt(a.code) > parseInt(b.code)) ? 1 : ((parseInt(b.code) > parseInt(a.code)) ? -1 : 0));
        }
        else if(level == 1){//CUENTA
            const index0 = ancestorsIndex[0];
            const index1 = ancestorsIndex[1];
            if(!(this.initData as any)[index0].children[index1].children) (this.initData as any)[index0].children[index1].children = [];
            // Si asigna cuenta maestra la eliminamos
            if(child.account_category_id){
                (this.initData as any).map( (tipo: any) => tipo.children.map( (subtipo: any) => subtipo.children.map((cuenta: any) => {
                    if(cuenta.account_category_id == child.account_category_id){
                        cuenta.account_category_id = undefined;
                    }
                    cuenta.children.map( (subcuenta: any) => {
                        if(subcuenta.account_category_id == child.account_category_id) subcuenta.account_category_id = undefined;
                    });
                })));
            }
            (this.initData as any)[index0].children[index1].children.push(child);
            (this.initData as any)[index0].children[index1].children.sort((a: any, b: any) => (parseInt(a.code) > parseInt(b.code)) ? 1 : ((parseInt(b.code) > parseInt(a.code)) ? -1 : 0));
        }
        else if(level == 2){//SUBCUENTA
            const index0 = ancestorsIndex[0];
            const index1 = ancestorsIndex[1];
            const index2 = ancestorsIndex[2];
            if(!(this.initData as any)[index0].children[index1].children[index2].children) (this.initData as any)[index0].children[index1].children[index2].children = [];
            // Si asigna cuenta maestra la eliminamos
            if(child.account_category_id){
                (this.initData as any).map( (tipo: any) => tipo.children.map( (subtipo: any) => subtipo.children.map((cuenta: any) => {
                    if(cuenta.account_category_id == child.account_category_id){
                        cuenta.account_category_id = undefined;
                    }
                    cuenta.children.map( (subcuenta: any) => {
                        if(subcuenta.account_category_id == child.account_category_id) subcuenta.account_category_id = undefined;
                    });
                })));
            }
            // Si trabaja_con_auxiliar_con_rut padre tambien
            if(child.trabaja_con_auxiliar_con_rut){
                (this.initData as any)[index0].children[index1].children[index2].trabaja_con_auxiliar_con_rut = true;
            }
            // Si trabaja_con_auxiliar padre tambien
            if(child.trabaja_con_auxiliar){
                (this.initData as any)[index0].children[index1].children[index2].trabaja_con_auxiliar = true;
            }
            // Si trabaja_con_centro_costo padre tambien
            if(child.trabaja_con_centro_costo){
                (this.initData as any)[index0].children[index1].children[index2].trabaja_con_centro_costo = true;
            }
            (this.initData as any)[index0].children[index1].children[index2].children.push(child);
            (this.initData as any)[index0].children[index1].children[index2].children.sort((a: any, b: any) => (parseInt(a.code) > parseInt(b.code)) ? 1 : ((parseInt(b.code) > parseInt(a.code)) ? -1 : 0));
        }
        this.dataChange.next(this.initData);
    }

    updateItem(Node: FoodNode, level: number, ancestorsIndex: number[] = []) {

        if(level == 1){//SUBTIPO
            const index0 = ancestorsIndex[0];
            const index1 = ancestorsIndex[1];
            (this.initData as any)[index0].children[index1].name = Node.name;
            (this.initData as any)[index0].children.sort((a: any, b: any) => (parseInt(a.code) > parseInt(b.code)) ? 1 : ((parseInt(b.code) > parseInt(a.code)) ? -1 : 0));
        }
        else if(level == 2){//CUENTA
            const index0 = ancestorsIndex[0];
            const index1 = ancestorsIndex[1];
            const index2 = ancestorsIndex[2];
            // Si asigna cuenta maestra la eliminamos
            if(Node.account_category_id){
                (this.initData as any).map( (tipo: any) => tipo.children.map( (subtipo: any) => subtipo.children.map((cuenta: any) => {
                    if(cuenta.account_category_id == Node.account_category_id){
                        cuenta.account_category_id = undefined;
                    }
                    cuenta.children.map( (subcuenta: any) => {
                        if(subcuenta.account_category_id == Node.account_category_id) subcuenta.account_category_id = undefined;
                    });
                })));
            }
            // Operatividad: Si hereda configuracion copiamos a los hijos
            if(Node.operation_inherited_configuration){
                (this.initData as any)[index0].children[index1].children[index2].children.map((r: any) => {
                    r.trabaja_con_auxiliar_con_rut = Node.trabaja_con_auxiliar_con_rut;
                    r.trabaja_con_auxiliar = Node.trabaja_con_auxiliar;
                    r.trabaja_con_centro_costo = Node.trabaja_con_centro_costo;
                });
            }
            // Si no trabaja con auxiliar con rut -> subcuenta tampoco y tampoco tiene cuenta maestra
            if(!Node.trabaja_con_auxiliar_con_rut){
                (this.initData as any)[index0].children[index1].children[index2].children.map((r: any) => {
                    r.trabaja_con_auxiliar_con_rut = undefined;
                    r.account_category_id = undefined;
                });
            }

            (this.initData as any)[index0].children[index1].children[index2].name = Node.name;
            (this.initData as any)[index0].children[index1].children[index2].trabaja_con_auxiliar_con_rut = Node.trabaja_con_auxiliar_con_rut;
            (this.initData as any)[index0].children[index1].children[index2].trabaja_con_auxiliar = Node.trabaja_con_auxiliar;
            (this.initData as any)[index0].children[index1].children[index2].trabaja_con_centro_costo = Node.trabaja_con_centro_costo;
            (this.initData as any)[index0].children[index1].children[index2].ifrs_code = Node.ifrs_code;
            (this.initData as any)[index0].children[index1].children[index2].account_category_id = Node.account_category_id;
            (this.initData as any)[index0].children[index1].children.sort((a: any, b: any) => (parseInt(a.code) > parseInt(b.code)) ? 1 : ((parseInt(b.code) > parseInt(a.code)) ? -1 : 0));
        }
        else if(level == 3){//SUBCUENTA
            const index0 = ancestorsIndex[0];
            const index1 = ancestorsIndex[1];
            const index2 = ancestorsIndex[2];
            const index3 = ancestorsIndex[3];
            // Si asigna cuenta maestra la eliminamos
            if(Node.account_category_id){
                (this.initData as any).map( (tipo: any) => tipo.children.map( (subtipo: any) => subtipo.children.map((cuenta: any) => {
                    if(cuenta.account_category_id == Node.account_category_id){
                        cuenta.account_category_id = undefined;
                    }
                    cuenta.children.map( (subcuenta: any) => {
                        if(subcuenta.account_category_id == Node.account_category_id) subcuenta.account_category_id = undefined;
                    });
                })));
            }
            // Si trabaja_con_auxiliar_con_rut padre tambien
            if(Node.trabaja_con_auxiliar_con_rut){
                (this.initData as any)[index0].children[index1].children[index2].trabaja_con_auxiliar_con_rut = true;
            }
            // Si trabaja_con_auxiliar padre tambien
            if(Node.trabaja_con_auxiliar){
                (this.initData as any)[index0].children[index1].children[index2].trabaja_con_auxiliar = true;
            }
            // Si trabaja_con_centro_costo padre tambien
            if(Node.trabaja_con_centro_costo){
                (this.initData as any)[index0].children[index1].children[index2].trabaja_con_centro_costo = true;
            }
            (this.initData as any)[index0].children[index1].children[index2].children[index3].name = Node.name;
            (this.initData as any)[index0].children[index1].children[index2].children[index3].trabaja_con_auxiliar_con_rut = Node.trabaja_con_auxiliar_con_rut;
            (this.initData as any)[index0].children[index1].children[index2].children[index3].trabaja_con_auxiliar = Node.trabaja_con_auxiliar;
            (this.initData as any)[index0].children[index1].children[index2].children[index3].trabaja_con_centro_costo = Node.trabaja_con_centro_costo;
            (this.initData as any)[index0].children[index1].children[index2].children[index3].ifrs_code = Node.ifrs_code;
            (this.initData as any)[index0].children[index1].children[index2].children[index3].account_category_id = Node.account_category_id;
            (this.initData as any)[index0].children[index1].children[index2].children.sort((a: any, b: any) => (parseInt(a.code) > parseInt(b.code)) ? 1 : ((parseInt(b.code) > parseInt(a.code)) ? -1 : 0));
        }
        this.dataChange.next(this.initData);
    }

    deleteItem(level: number, ancestorsIndex: number[]){
        if(level == 1){//SUBTIPO
            const index0 = ancestorsIndex[0];
            const index1 = ancestorsIndex[1];
            (this.initData as any)[index0].children.splice(index1, 1);
        }
        else if(level == 2){//CUENTA
            const index0 = ancestorsIndex[0];
            const index1 = ancestorsIndex[1];
            const index2 = ancestorsIndex[2];
            (this.initData as any)[index0].children[index1].children.splice(index2, 1);
        }
        else if(level == 3){//SUBCUENTA
            const index0 = ancestorsIndex[0];
            const index1 = ancestorsIndex[1];
            const index2 = ancestorsIndex[2];
            const index3 = ancestorsIndex[3];
            (this.initData as any)[index0].children[index1].children[index2].children.splice(index3, 1);
        }
        this.dataChange.next(this.initData);
    }

    public filter(filterText: string) {
        let filteredTreeData;
        //Para buscar string mayor a 3
        if (filterText && filterText.length > 3) {
            filteredTreeData = this.filterTree(this.initData, filterText);
        }else{
            filteredTreeData = this.accountPlanData;
        }
        // file node as children.
        const data = filteredTreeData;
        // Notify the change.
        this.dataChange.next(data);
    }

    filterTree(array: any[], filterText: string){
        const getNodes = (result: any[], object: any) => {
            filterText = filterText.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            var re = new RegExp(filterText, 'ig');
            var NAME = object.name?.normalize("NFD").replace(/[\u0300-\u036f]/g, "") || '';
            var CODE = object.code?.normalize("NFD").replace(/[\u0300-\u036f]/g, "") || '';
            if (NAME?.match(re) || CODE?.match(re)) {
                result.push(object);
                return result;
            }
            if (Array.isArray(object.children)) {
                const nodes = object.children.reduce(getNodes, []);
                if (nodes.length) result.push({ ...object, children: nodes });
            }
            return result;
        };

        return array.reduce(getNodes, []);
    }

}
