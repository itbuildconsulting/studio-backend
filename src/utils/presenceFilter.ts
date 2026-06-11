import { Op } from 'sequelize';
import Config from '../models/Config.model';

/**
 * Retorna o filtro Sequelize correto para contar presença em ClassStudent.
 * status = false significa cancelamento — sempre excluído em ambos os modos.
 *
 * - checkinSpinGo ativo  → checkin IS NOT NULL + status != false
 * - checkinSpinGo inativo → status = true (inscrito e não cancelado)
 */
export async function getPresenceFilter(): Promise<Record<string, any>> {
    const config = await Config.findOne({ where: { configKey: 'checkinSpinGo' } });
    return config?.active === 1
        ? {
            checkin: { [Op.not]: null },
            [Op.or]: [{ status: true }, { status: null }]
          }
        : { status: true };
}
