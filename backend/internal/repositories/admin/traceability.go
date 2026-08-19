package admin

import (
	"context"
	"fmt"
)

// Traceability is deliberately keyed by animal_receptions.tag_id.  It does
// not accept animals.id because the authoritative schema does not relate that
// UUID table to receptions.
func (r *Repository) Traceability(ctx context.Context, tagID string) (map[string]interface{}, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	var receptions []map[string]interface{}
	if _, err := r.db.Client.From("animal_receptions").Select("tag_id,slaughterhouse_id,farmer,transporter,vehicle_number,arrival_date,arrival_time,breed,weight,batch,status,created_at", "", false).Eq("tag_id", tagID).ExecuteToWithContext(ctx, &receptions); err != nil {
		return nil, fmt.Errorf("read reception: %w", err)
	}
	if len(receptions) == 0 {
		return nil, ErrNotFound
	}

	// Every query below uses a supplied foreign key from the authoritative
	// schema. No relationship to animals, farmers, processors, or consumers is
	// inferred here.
	var anteMortem, operations, carcasses, inspections, shipments, records []map[string]interface{}
	if _, err := r.db.Client.From("ante_mortem_inspections").Select("id,animal_id,vet,batch,health_check,body_condition,signs_of_disease,temperature,notes,outcome,inspected_at", "", false).Eq("animal_id", tagID).ExecuteToWithContext(ctx, &anteMortem); err != nil {
		return nil, err
	}
	if _, err := r.db.Client.From("slaughter_operations").Select("id,animal_id,batch,stage,staff,method,facility,remarks,started_at,completed_at,created_at", "", false).Eq("animal_id", tagID).ExecuteToWithContext(ctx, &operations); err != nil {
		return nil, err
	}
	if _, err := r.db.Client.From("carcasses").Select("id,animal_id,weight,grade,quality,inspection_result,storage,created_at", "", false).Eq("animal_id", tagID).ExecuteToWithContext(ctx, &carcasses); err != nil {
		return nil, err
	}
	if _, err := r.db.Client.From("carcass_inspections").Select("carcass_id,tag_id,inspector,outcome,reason,comments,inspected_at", "", false).Eq("tag_id", tagID).ExecuteToWithContext(ctx, &inspections); err != nil {
		return nil, err
	}
	if _, err := r.db.Client.From("slaughter_records").Select("id,animal_id,slaughterhouse_id,carcass_id,created_at", "", false).Eq("animal_id", tagID).ExecuteToWithContext(ctx, &records); err != nil {
		return nil, err
	}

	carcassIDs := make([]string, 0, len(carcasses))
	for _, carcass := range carcasses {
		if id, ok := carcass["id"].(string); ok {
			carcassIDs = append(carcassIDs, id)
		}
	}
	if len(carcassIDs) > 0 {
		// PostgREST's in filter is only built from IDs just read from the
		// database, never directly from request input.
		if _, err := r.db.Client.From("slaughterhouse_shipments").Select("id,slaughterhouse_id,carcass_id,destination,processor,driver,vehicle,departure,status,created_at", "", false).In("carcass_id", carcassIDs).ExecuteToWithContext(ctx, &shipments); err != nil {
			return nil, err
		}
	}
	var slaughterhouses []map[string]interface{}
	orgID, _ := receptions[0]["slaughterhouse_id"].(string)
	if orgID != "" {
		if _, err := r.db.Client.From("organizations").Select("id,organization_code,name,organization_type,status,verified", "", false).Eq("id", orgID).Eq("organization_type", "slaughterhouse").ExecuteToWithContext(ctx, &slaughterhouses); err != nil {
			return nil, err
		}
	}
	return map[string]interface{}{"reception": receptions[0], "anteMortemInspections": anteMortem, "slaughterOperations": operations, "carcasses": carcasses, "carcassInspections": inspections, "shipments": shipments, "slaughterRecords": records, "slaughterhouse": firstOrNil(slaughterhouses)}, nil
}

func firstOrNil(rows []map[string]interface{}) interface{} {
	if len(rows) == 0 {
		return nil
	}
	return rows[0]
}
